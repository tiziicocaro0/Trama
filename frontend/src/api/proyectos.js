import cliente, { clienteApi } from './cliente.js'
import { calcularEdad } from '../features/perfil/perfil.js'
export { PROYECTOS_MOCK } from './proyectos.mock.js'

export function filtrarProyectosPorMiembro(proyectos, usuarioId) {
  return proyectos.filter((proyecto) => !proyecto.miembrosIds || proyecto.miembrosIds.includes(usuarioId))
}

// Adaptador compartido por MisProyectos (develop) y Acompañamientos (RF-10).
export async function obtenerMisProyectos(usuarioId, signal) {
  const lista = await listarMisProyectos(signal)
  signal?.throwIfAborted()
  const propios = usuarioId ? filtrarProyectosPorMiembro(lista, usuarioId) : lista
  const etiquetasRol = { TUTOR: 'Tutor/a', FAMILIAR: 'Familiar', EDUCACION: 'Educación', SALUD: 'Salud' }
  return Promise.all(propios.map(async (item) => {
    const detalle = item.edad || item.fechaNacimiento ? item : await obtenerProyecto(item.id, signal)
    const proyecto = { ...item, ...detalle }
    const edad = calcularEdad(proyecto.fechaNacimiento)
    return {
      ...proyecto,
      iniciales: proyecto.iniciales ?? proyecto.nombre.slice(0, 2).toLocaleUpperCase('es'),
      tono: proyecto.tono ?? 'terracota',
      edad: proyecto.edad ?? (edad === null ? 'Edad no disponible' : `${edad} ${edad === 1 ? 'año' : 'años'}`),
      rol: etiquetasRol[proyecto.rol] ?? proyecto.rol,
    }
  }))
}

export async function obtenerRedProyecto(id, signal) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.get(
    `/proyectos/${encodeURIComponent(id)}/red`,
    { signal },
  )
  if (
    !Array.isArray(data) ||
    data.some(
      (persona) =>
        !persona?.id ||
        typeof persona.nombre !== 'string' ||
        typeof persona.apellido !== 'string' ||
        !['SALUD', 'EDUCACION'].includes(persona.rol),
    )
  ) {
    throw new Error('No pudimos verificar los profesionales vinculados.')
  }
  return data
}

export async function crearProyecto(datos) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  let respuesta
  try {
    respuesta = await cliente.post('/proyectos', datos)
  } catch (error) {
    if (error.response?.status === 400)
      throw new Error(
        'Revisá los datos y confirmá tu autorización antes de continuar.',
        { cause: error },
      )
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
    if (error.response?.status === 403)
      throw new Error('No tenés permiso para crear este acompañamiento.', { cause: error })
    throw new Error(
      'No pudimos confirmar la creación. Revisá tus acompañamientos antes de volver a intentarlo.',
      { cause: error },
    )
  }
  if (typeof respuesta.data?.id !== 'string' || !respuesta.data.id.trim()) {
    throw new Error(
      'No recibimos la confirmación. Revisá tus acompañamientos antes de volver a intentarlo.',
    )
  }
  return respuesta.data
}

export async function listarMisProyectos(signal) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  const { data } = await cliente.get('/proyectos', ...(signal ? [{ signal }] : []))
  if (
    !Array.isArray(data) ||
    data.some(
      (proyecto) =>
        typeof proyecto?.id !== 'string' ||
        !proyecto.id.trim() ||
        typeof proyecto.nombre !== 'string' ||
        !proyecto.nombre.trim(),
    )
  ) {
    throw new Error('No pudimos verificar la lista de proyectos.')
  }
  return data
}

export async function obtenerProyecto(id, signal) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  const { data } = await cliente.get(`/proyectos/${encodeURIComponent(id)}`, {
    signal,
  })
  if (
    data?.id !== id ||
    typeof data.nombre !== 'string' ||
    !data.nombre.trim()
  ) {
    throw new Error('No pudimos verificar los datos del proyecto.')
  }
  return data
}

export const MIEMBROS_MOCK = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    nombre: 'Marta Fernández',
    iniciales: 'MF',
    tono: 'terracota',
    rol: 'Tutora administradora',
    detalle: 'Madre',
    esAdmin: true,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    nombre: 'María Díaz',
    iniciales: 'MD',
    tono: 'oliva',
    rol: 'Educación',
    detalle: 'Docente · 3.º grado',
    esAdmin: false,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    nombre: 'Diego Torres',
    iniciales: 'DT',
    tono: 'agua',
    rol: 'Salud',
    detalle: 'Psicología · MN 12345',
    esAdmin: false,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    nombre: 'Elena Sosa',
    iniciales: 'ES',
    tono: 'miel',
    rol: 'Familiar',
    detalle: 'Abuela',
    esAdmin: false,
  },
]

/**
 * Revoca el acceso de un miembro al proyecto mediante `DELETE /api/proyectos/{id}/miembros/{miembroId}`.
 */
export async function quitarMiembroProyecto(proyectoId, miembroId) {
  const api = clienteApi ?? cliente
  return api.delete(`/proyectos/${proyectoId}/miembros/${miembroId}`)
}

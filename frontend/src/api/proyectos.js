import cliente from './cliente.js'
import { calcularEdad } from '../features/perfil/perfil.js'


// 1.10: proyectos del usuario para la página Acompañamientos.
// El back ya devuelve solo los proyectos donde el usuario es miembro.
export async function obtenerMisProyectos(signal) {
  const propios = await listarMisProyectos(signal)
  signal?.throwIfAborted()
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

// Editar los datos del niño (DatosPersonalesPage). PUT /api/proyectos/{id}, solo el tutor administrador.
// Devuelve el error de Axios tal cual: la pantalla arma el mensaje según el estado.
export async function actualizarProyecto(id, datos) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  const { data } = await cliente.put(`/proyectos/${encodeURIComponent(id)}`, datos)
  return data
}

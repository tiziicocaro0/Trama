export const seccionesPerfil = [
  {
    slug: 'fortalezas',
    titulo: 'Fortalezas',
    tipo: 'FORTALEZA',
    tono: 'bg-secundario text-superficie',
  },
  {
    slug: 'intereses',
    titulo: 'Intereses',
    tipo: 'INTERES',
    tono: 'bg-miel text-texto',
  },
  {
    slug: 'comunicacion',
    titulo: 'Comunicación',
    tipo: 'COMUNICACION',
    tono: 'bg-agua text-superficie',
  },
  {
    slug: 'perfil-sensorial',
    titulo: 'Perfil sensorial',
    tipo: 'SENSORIAL',
    tono: 'bg-primario text-superficie',
  },
  {
    slug: 'estrategias',
    titulo: 'Estrategias',
    tipo: 'ESTRATEGIA',
    tono: 'bg-agua text-superficie',
  },
  {
    slug: 'rutinas',
    titulo: 'Rutinas',
    tipo: 'RUTINA',
    tono: 'bg-miel text-texto',
  },
]

export const seccionNotas = {
  slug: 'notas',
  titulo: 'Notas',
  tipo: 'NOTA_PROFESIONAL',
  tono: 'bg-secundario text-superficie',
}

export function calcularEdad(fechaNacimiento, hoy = new Date()) {
  if (
    typeof fechaNacimiento !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
  )
    return null
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number)
  // Se usan fechas de calendario locales para evitar desplazar el cumpleaños por UTC.
  const fecha = new Date(anio, mes - 1, dia)
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia ||
    fecha > hoy
  )
    return null
  const cumplio =
    hoy.getMonth() > mes - 1 ||
    (hoy.getMonth() === mes - 1 && hoy.getDate() >= dia)
  return hoy.getFullYear() - anio - (cumplio ? 0 : 1)
}

// Campos propios de un aporte (el JSON "datos"). Si falta o no es un objeto, devuelve {}.
export function leerDatosAporte(texto) {
  try {
    const datos = JSON.parse(texto ?? '')
    return datos && typeof datos === 'object' && !Array.isArray(datos)
      ? datos
      : {}
  } catch {
    return {}
  }
}

export const CONTEXTOS_OBSERVACION = [
  ['CASA', 'Casa'],
  ['ESCUELA', 'Escuela'],
  ['CONSULTORIO', 'Consultorio'],
  ['OTRO', 'Otro'],
]

export const ETIQUETAS_OBSERVACION = [
  ['LOGRO', 'Logro'],
  ['DIFICULTAD', 'Dificultad'],
  ['SALUD', 'Salud'],
  ['CONDUCTA', 'Conducta'],
  ['SOCIAL', 'Social'],
  ['COMUNICACION', 'Comunicación'],
  ['OTRO', 'Otro'],
]

export const ETIQUETAS_CONTEXTO = Object.fromEntries(CONTEXTOS_OBSERVACION)
export const ETIQUETAS_TAG = Object.fromEntries(ETIQUETAS_OBSERVACION)

export const TAMANIO_PAGINA_BITACORA = 20

export const FILTROS_INICIALES_BITACORA = {
  desde: '',
  hasta: '',
  contexto: '',
  etiqueta: '',
  autorId: '',
}

export function tieneFiltrosActivos(filtros) {
  if (!filtros) return false
  return Boolean(
    filtros.desde ||
      filtros.hasta ||
      filtros.contexto ||
      filtros.etiqueta ||
      filtros.autorId,
  )
}

export function obtenerFechaHoraLocalActual(ahora = new Date()) {
  const pad = (numero) => String(numero).padStart(2, '0')
  const anio = ahora.getFullYear()
  const mes = pad(ahora.getMonth() + 1)
  const dia = pad(ahora.getDate())
  const horas = pad(ahora.getHours())
  const minutos = pad(ahora.getMinutes())
  return `${anio}-${mes}-${dia}T${horas}:${minutos}`
}

export function convertirFechaLocalAOffsetIso(valorLocal) {
  if (typeof valorLocal !== 'string' || !valorLocal.trim()) return null
  const limpio = valorLocal.trim()
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(limpio)) {
    return limpio
  }
  const fecha = new Date(limpio)
  if (Number.isNaN(fecha.getTime())) return null
  const pad = (numero) => String(numero).padStart(2, '0')
  const offsetMinutos = -fecha.getTimezoneOffset()
  const signo = offsetMinutos >= 0 ? '+' : '-'
  const absMinutos = Math.abs(offsetMinutos)
  const offsetHoras = pad(Math.floor(absMinutos / 60))
  const offsetResto = pad(absMinutos % 60)
  const anio = fecha.getFullYear()
  const mes = pad(fecha.getMonth() + 1)
  const dia = pad(fecha.getDate())
  const horas = pad(fecha.getHours())
  const minutos = pad(fecha.getMinutes())
  const segundos = pad(fecha.getSeconds())
  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}${signo}${offsetHoras}:${offsetResto}`
}

export function leerDatosObservacion(datosRaw) {
  try {
    const parsed =
      typeof datosRaw === 'string' ? JSON.parse(datosRaw) : datosRaw
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { fecha: null, contexto: null, etiquetas: [] }
    }
    return {
      fecha: typeof parsed.fecha === 'string' ? parsed.fecha : null,
      contexto: typeof parsed.contexto === 'string' ? parsed.contexto : null,
      etiquetas: Array.isArray(parsed.etiquetas)
        ? parsed.etiquetas.filter((item) => typeof item === 'string')
        : [],
    }
  } catch {
    return { fecha: null, contexto: null, etiquetas: [] }
  }
}

export function filtrarObservaciones(observaciones, filtros) {
  if (!Array.isArray(observaciones)) return []
  if (!tieneFiltrosActivos(filtros)) return observaciones

  return observaciones.filter((observacion) => {
    const info = leerDatosObservacion(observacion?.datos)
    const fechaIso = info.fecha ?? observacion?.creadoEn ?? ''
    const fechaDia = typeof fechaIso === 'string' ? fechaIso.slice(0, 10) : ''

    if (filtros.desde && (!fechaDia || fechaDia < filtros.desde)) return false
    if (filtros.hasta && (!fechaDia || fechaDia > filtros.hasta)) return false
    if (filtros.contexto && info.contexto !== filtros.contexto) return false
    if (filtros.etiqueta && !info.etiquetas.includes(filtros.etiqueta)) {
      return false
    }
    if (filtros.autorId && observacion?.autorId !== filtros.autorId) {
      return false
    }
    return true
  })
}

export function ordenarObservacionesPorFecha(observaciones) {
  if (!Array.isArray(observaciones)) return []
  return [...observaciones].sort((a, b) => {
    const fechaA = leerDatosObservacion(a?.datos).fecha ?? a?.creadoEn ?? ''
    const fechaB = leerDatosObservacion(b?.datos).fecha ?? b?.creadoEn ?? ''
    const msA = new Date(fechaA).getTime()
    const msB = new Date(fechaB).getTime()
    if (Number.isNaN(msA) && Number.isNaN(msB)) return 0
    if (Number.isNaN(msA)) return 1
    if (Number.isNaN(msB)) return -1
    return msB - msA
  })
}

export function resolverNombreAutor(aporte, miembros = [], usuarioActual = null) {
  if (typeof aporte?.autorNombre === 'string' && aporte.autorNombre.trim()) {
    return aporte.autorNombre.trim()
  }
  if (typeof aporte?.autor === 'string' && aporte.autor.trim()) {
    return aporte.autor.trim()
  }
  if (
    aporte?.autor &&
    typeof aporte.autor === 'object' &&
    typeof aporte.autor.nombre === 'string'
  ) {
    return [aporte.autor.nombre, aporte.autor.apellido]
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  if (Array.isArray(miembros) && aporte?.autorId) {
    const miembro = miembros.find(
      (item) =>
        item.usuarioId === aporte.autorId || item.id === aporte.autorId,
    )
    if (miembro) {
      return [miembro.nombre, miembro.apellido].filter(Boolean).join(' ').trim()
    }
  }
  if (
    usuarioActual &&
    aporte?.autorId &&
    usuarioActual.id === aporte.autorId &&
    usuarioActual.nombre
  ) {
    return [usuarioActual.nombre, usuarioActual.apellido]
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  return 'Miembro de la red'
}

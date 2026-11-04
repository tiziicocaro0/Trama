// 8.2: fecha en la que se borra el perfil, para mostrarla ("12 de noviembre de 2026").
export function formatearFechaEliminacion(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha)
}

// Para confirmar hay que escribir el nombre del niño: sin importar mayúsculas, tildes ni espacios de más
export function coincideNombre(escrito, nombre) {
  const normalizar = (texto) =>
    (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLocaleLowerCase('es')
  return Boolean(normalizar(nombre)) && normalizar(escrito) === normalizar(nombre)
}

export function mensajeDeError(error, porDefecto) {
  return error?.response?.data?.mensaje || porDefecto
}

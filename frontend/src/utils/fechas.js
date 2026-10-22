export function formatearFechaCalendario(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor))
    return null
  const [anio, mes, dia] = valor.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  )
    return null
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

export function formatearFechaHora(valor, zonaHoraria) {
  if (typeof valor !== 'string' || !valor.trim()) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    ...(zonaHoraria ? { timeZone: zonaHoraria } : {}),
  }).format(fecha)
}

export const DIAS_SEMANA = [
  { valor: '1', etiqueta: 'Lunes' },
  { valor: '2', etiqueta: 'Martes' },
  { valor: '3', etiqueta: 'Miércoles' },
  { valor: '4', etiqueta: 'Jueves' },
  { valor: '5', etiqueta: 'Viernes' },
  { valor: '6', etiqueta: 'Sábado' },
  { valor: '7', etiqueta: 'Domingo' },
]

export function nombreDiaSemana(diaSemana) {
  const encontrado = DIAS_SEMANA.find(
    (dia) => Number(dia.valor) === Number(diaSemana),
  )
  return encontrado?.etiqueta ?? ''
}

export function obtenerDiaSemanaIso(fechaIso) {
  if (typeof fechaIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) {
    return '1'
  }
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  if (Number.isNaN(fecha.getTime())) return '1'
  const diaJs = fecha.getDay()
  return String(diaJs === 0 ? 7 : diaJs)
}

export function ajustarFechaADiaSemana(fechaIso, diaSemanaDestino) {
  const destino = Number(diaSemanaDestino)
  if (
    typeof fechaIso !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaIso) ||
    !Number.isInteger(destino) ||
    destino < 1 ||
    destino > 7
  ) {
    return fechaIso
  }
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const base = new Date(anio, mes - 1, dia)
  if (Number.isNaN(base.getTime())) return fechaIso

  const actualJs = base.getDay()
  const actualIso = actualJs === 0 ? 7 : actualJs
  const diferencia = (destino - actualIso + 7) % 7
  base.setDate(base.getDate() + diferencia)

  const nuevoAnio = base.getFullYear()
  const nuevoMes = String(base.getMonth() + 1).padStart(2, '0')
  const nuevoDia = String(base.getDate()).padStart(2, '0')
  return `${nuevoAnio}-${nuevoMes}-${nuevoDia}`
}


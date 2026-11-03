import { hoyIso } from '../../../utils/fechas.js'

export function fechaLocal(valor) {
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function sumarDias(valor, cantidad) {
  const fecha = fechaLocal(valor)
  fecha.setDate(fecha.getDate() + cantidad)
  return hoyIso(fecha)
}

export function inicioSemana(valor) {
  const dia = fechaLocal(valor).getDay()
  return sumarDias(valor, -(dia === 0 ? 6 : dia - 1))
}

export function obtenerPeriodo(vista, referencia) {
  if (vista === 'semana') {
    const desde = inicioSemana(referencia)
    return { desde, hasta: sumarDias(desde, 6), dias: Array.from({ length: 7 }, (_, indice) => sumarDias(desde, indice)) }
  }
  const fecha = fechaLocal(referencia)
  const primero = hoyIso(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
  const ultimo = hoyIso(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0))
  const desde = inicioSemana(primero)
  const hasta = sumarDias(inicioSemana(ultimo), 6)
  const cantidad = Math.round((fechaLocal(hasta) - fechaLocal(desde)) / 86400000) + 1
  return { desde, hasta, dias: Array.from({ length: cantidad }, (_, indice) => sumarDias(desde, indice)) }
}

export function moverPeriodo(vista, referencia, direccion) {
  if (vista === 'semana') return sumarDias(referencia, direccion * 7)
  const fecha = fechaLocal(referencia)
  return hoyIso(new Date(fecha.getFullYear(), fecha.getMonth() + direccion, 1))
}

export function eventosDelDia(eventos, dia) {
  return eventos.filter((evento) => (evento.fechaOcurrencia || evento.fecha) === dia)
}

export function tituloPeriodo(vista, referencia, periodo) {
  if (vista === 'mes') return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fechaLocal(referencia))
  const inicio = fechaLocal(periodo.desde)
  const fin = fechaLocal(periodo.hasta)
  const mes = new Intl.DateTimeFormat('es-AR', { month: 'long' })
  return `${inicio.getDate()}–${fin.getDate()} de ${mes.format(fin)} ${fin.getFullYear()}`
}

export function tituloDia(valor) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(fechaLocal(valor))
}

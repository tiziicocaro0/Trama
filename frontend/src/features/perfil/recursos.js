import { ETIQUETAS_APORTE } from './iconosAporte.js'

// Reglas de la galería de Recursos que comparten la miniatura y el visor.

export function esImagen(recurso) {
  return ['image/jpeg', 'image/png'].includes(recurso?.tipoMime)
}

// Dónde se cargó: en una sección del perfil (como adjunto de un aporte) o directo en Recursos
export function dondeSeCargo(recurso) {
  if (recurso.origen !== 'APORTE') return 'Recursos'
  return ETIQUETAS_APORTE[recurso.tipoAporte] ?? 'Un aporte'
}

const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  hourCycle: 'h23',
})

export function formatearSubida(fecha) {
  const valor = new Date(fecha)
  return Number.isNaN(valor.getTime()) ? '' : formatoFechaHora.format(valor)
}

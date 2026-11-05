// Avisos flotantes: los mensajes que confirman o rechazan una acción ("Guardamos la foto",
// "No pudimos guardar") salen junto a la campana y se van solos, en vez de quedar
// metidos dentro de cada pantalla. Cualquier componente los dispara con avisar().

export const DURACION = { aviso: 5000, error: 8000 }
const MAXIMO_EN_PANTALLA = 4

let avisos = []
let siguienteId = 1
const oyentes = new Set()

function emitir() {
  oyentes.forEach((oyente) => oyente())
}

export function avisar(texto, tipo = 'aviso') {
  if (!texto) return null
  const id = siguienteId++
  avisos = [...avisos, { id, texto, tipo }].slice(-MAXIMO_EN_PANTALLA)
  emitir()
  return id
}

export function avisarError(texto) {
  return avisar(texto, 'error')
}

export function cerrarAviso(id) {
  avisos = avisos.filter((aviso) => aviso.id !== id)
  emitir()
}

export function limpiarAvisos() {
  avisos = []
  emitir()
}

export function suscribirAvisos(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function obtenerAvisos() {
  return avisos
}

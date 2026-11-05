// Borradores de eventos: si se cierra el formulario sin guardar (por ejemplo, tocando
// afuera), lo escrito queda guardado en este navegador para ese día o ese evento.
// El almacenamiento puede no estar disponible (modo privado): entonces no se guarda nada.

const PREFIJO = 'trama.borrador-evento'

export function claveBorradorNuevo(fecha) {
  return `nuevo:${fecha}`
}

export function claveBorradorEdicion(evento, alcance) {
  return `evento:${evento.id}:${alcance}:${evento.fechaOcurrencia ?? evento.fecha ?? ''}`
}

function claveCompleta(proyectoId, clave) {
  return `${PREFIJO}:${proyectoId}:${clave}`
}

export function leerBorrador(proyectoId, clave) {
  if (!proyectoId || !clave) return null
  try {
    const texto = window.localStorage.getItem(claveCompleta(proyectoId, clave))
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}

export function guardarBorrador(proyectoId, clave, datos) {
  if (!proyectoId || !clave) return
  try {
    window.localStorage.setItem(claveCompleta(proyectoId, clave), JSON.stringify(datos))
  } catch {
    // Sin almacenamiento disponible, el borrador simplemente no se guarda.
  }
}

export function borrarBorrador(proyectoId, clave) {
  if (!proyectoId || !clave) return
  try {
    window.localStorage.removeItem(claveCompleta(proyectoId, clave))
  } catch {
    // Nada que borrar.
  }
}

// 1.4: si alguien abre el enlace sin sesión, al ingresar o registrarse vuelve a la invitación.
// Es una comodidad: si el navegador no deja guardar, la persona vuelve a abrir el mail.
const CLAVE = 'trama.invitacionPendiente'

export function recordarInvitacion(ruta) {
  try {
    sessionStorage.setItem(CLAVE, ruta)
  } catch {
    // sin almacenamiento disponible
  }
}

export function invitacionPendiente() {
  try {
    const ruta = sessionStorage.getItem(CLAVE)
    return ruta?.startsWith('/invitaciones/') ? ruta : null
  } catch {
    return null
  }
}

export function olvidarInvitacion() {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // sin almacenamiento disponible
  }
}

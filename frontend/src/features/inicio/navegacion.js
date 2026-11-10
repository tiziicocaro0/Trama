import { CalendarBlank, CreditCard, SquaresFour, User, Users } from '@phosphor-icons/react'

// Secciones de la navegación principal: las usan el menú lateral de Inicio
// y la barra de íconos de las pantallas de cada niño.
export const navegacion = [
  { id: '', titulo: 'Acompañamientos', icon: Users, to: '/acompanamientos' },
  // 7.1: solo las cuentas profesionales ven el panel
  { id: 'panel', titulo: 'Mi panel', icon: SquaresFour, to: '/panel', soloProfesionales: true },
  { id: 'calendario', titulo: 'Calendario', icon: CalendarBlank, to: '/inicio?seccion=calendario' },
  { id: 'perfil', titulo: 'Mi perfil', icon: User, to: '/perfil' },
  // 9.1: página propia (no es una sección de Inicio)
  { id: 'plan', titulo: 'Mi plan', icon: CreditCard, to: '/cuenta/plan' },
]

// Las secciones que ve este usuario
export function navegacionPara(usuario) {
  const esProfesional = usuario?.tipoCuenta === 'PROFESIONAL'
  return navegacion.filter((item) => !item.soloProfesionales || esProfesional)
}

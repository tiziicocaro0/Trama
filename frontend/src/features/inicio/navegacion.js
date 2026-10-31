import { BookOpen, CalendarBlank, CreditCard, User, Users } from '@phosphor-icons/react'

// Secciones de la navegación principal: las usan el menú lateral de Inicio
// y la barra de íconos de las pantallas de cada niño.
export const navegacion = [
  { id: '', titulo: 'Acompañamientos', icon: Users, to: '/acompanamientos' },
  { id: 'recursos', titulo: 'Recursos', icon: BookOpen, to: '/inicio?seccion=recursos' },
  { id: 'calendario', titulo: 'Calendario', icon: CalendarBlank, to: '/inicio?seccion=calendario' },
  { id: 'perfil', titulo: 'Mi perfil', icon: User, to: '/inicio?seccion=perfil' },
  // 9.1: página propia (no es una sección de Inicio)
  { id: 'plan', titulo: 'Mi plan', icon: CreditCard, to: '/cuenta/plan' },
]

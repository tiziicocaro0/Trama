import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import CampanaNotificaciones from './CampanaNotificaciones.jsx'

export default function NotificacionesGlobales() {
  const { pathname } = useLocation()
  const { usuario, estado } = useAuth()

  const esRutaPrivada =
    pathname === '/inicio' ||
    pathname === '/acompanamientos' ||
    pathname.startsWith('/acompanamientos/') ||
    pathname.startsWith('/proyectos/') ||
    // 9.x: Mi plan y la institución (el cambio de paquete llega como notificación)
    pathname.startsWith('/cuenta/') ||
    pathname === '/institucion'

  if (estado !== 'autenticado' || !usuario || !esRutaPrivada) {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-50 rounded-full bg-superficie p-1 shadow-md">
      <CampanaNotificaciones />
    </div>
  )
}
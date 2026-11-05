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
    pathname === '/perfil' ||
    pathname === '/institucion'

  // 5.3: "Mostrarle el día" es a pantalla completa, sin nada encima (la campana tapaba la X en el celular)
  const esVistaDelDia = /^\/proyectos\/[^/]+\/hoy$/.test(pathname)

  if (estado !== 'autenticado' || !usuario || !esRutaPrivada || esVistaDelDia) {
    return null
  }

  return (
    // z-30: por encima de la página, pero debajo de los modales y del panel del calendario (z-40/z-50),
    // que si no quedaban con su botón de cerrar tapado por la campana
    <div className="fixed right-4 top-4 z-30 rounded-full bg-superficie p-1 shadow-md">
      <CampanaNotificaciones />
    </div>
  )
}
import { Eye, House, SignOut } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { navegacionPara } from '../../features/inicio/navegacion.js'
import useVistaSimple from '../../features/perfil/useVistaSimple.js'

const CLASE_ICONO =
  'group relative flex size-12 items-center justify-center rounded-md text-texto-suave hover:bg-decoracion hover:text-primario focus-visible:outline-2 focus-visible:outline-primario'

function Etiqueta({ children }) {
  // Se ve al pasar el mouse o con el foco del teclado (en pantallas grandes).
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-texto px-2 py-1 text-sm text-superficie opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none lg:block"
    >
      {children}
    </span>
  )
}

// Navegación a un clic en las pantallas de cada niño: íconos a la izquierda en
// pantallas grandes y abajo en el celular.
export default function BarraIconos() {
  const { usuario, cerrarSesion } = useAuth()
  const { vistaSimple, setVistaSimple } = useVistaSimple()
  const { pathname } = useLocation()
  const idProyectoActual = pathname.match(/^\/proyectos\/([^/]+)/)?.[1]
  const items = [
    { titulo: 'Inicio', icon: House, to: '/inicio' },
    ...navegacionPara(usuario),
  ]
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde/60 bg-superficie print:hidden lg:inset-x-auto lg:top-0 lg:left-0 lg:w-20 lg:border-t-0 lg:border-r"
    >
      <ul className="flex items-center justify-around px-2 py-1 lg:h-svh lg:flex-col lg:justify-start lg:gap-2 lg:py-6">
        {/* Isologo (la puerta del arco de TRAMA): solo en la barra lateral de pantallas grandes */}
        <li className="mb-2 hidden lg:block">
          <Link
            to="/inicio"
            aria-label="TRAMA · Inicio"
            className="flex size-12 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-primario"
          >
            <img src="/favicon.svg" alt="" width="40" height="40" className="size-10" />
          </Link>
        </li>
        {items.map(({ titulo, icon: Icon, to }) => {
          const destino = titulo === 'Calendario' && idProyectoActual
            ? `/proyectos/${idProyectoActual}/calendario`
            : to
          const estaEnCalendario =
            pathname.endsWith('/calendario') && Boolean(idProyectoActual)

          const actual =
            (titulo === 'Calendario' && estaEnCalendario) ||
            (to === '/acompanamientos' &&
              Boolean(idProyectoActual) &&
              !estaEnCalendario)
              
          return (
            <li key={titulo}>
              <Link
                to={destino}
                aria-current={actual ? 'page' : undefined}
                className={`${CLASE_ICONO} ${actual ? 'bg-decoracion text-primario' : ''}`}
              >
                <Icon size={24} aria-hidden="true" />
                <span className="sr-only">{titulo}</span>
                <Etiqueta>{titulo}</Etiqueta>
              </Link>
            </li>
          )
        })}
        <li className="lg:mt-auto">
          <button
            type="button"
            onClick={() => setVistaSimple(!vistaSimple)}
            aria-pressed={vistaSimple}
            className={`${CLASE_ICONO} ${
              vistaSimple ? 'bg-decoracion text-primario' : ''
            }`}
          >
            <Eye size={24} aria-hidden="true" />
            <span className="sr-only">
              {vistaSimple ? 'Desactivar Vista simple' : 'Activar Vista simple'}
            </span>
            <Etiqueta>
              {vistaSimple ? 'Desactivar Vista simple' : 'Activar Vista simple'}
            </Etiqueta>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => cerrarSesion()} className={CLASE_ICONO}>
            <SignOut size={24} aria-hidden="true" />
            <span className="sr-only">Cerrar sesión</span>
            <Etiqueta>Cerrar sesión</Etiqueta>
          </button>
        </li>
      </ul>
    </nav>
  )
}

// Envuelve una pantalla del niño con la barra y le deja lugar.
export function ConBarraIconos({ children }) {
  return (
    <div className="pb-16 lg:pb-0 lg:pl-20">
      <BarraIconos />
      {children}
    </div>
  )
}

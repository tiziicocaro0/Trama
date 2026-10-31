import { House, SignOut } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { navegacion } from '../../features/inicio/navegacion.js'

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
  const { cerrarSesion } = useAuth()
  const { pathname } = useLocation()
  const items = [
    { titulo: 'Inicio', icon: House, to: '/inicio' },
    ...navegacion,
  ]
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde/60 bg-superficie print:hidden lg:inset-x-auto lg:top-0 lg:left-0 lg:w-20 lg:border-t-0 lg:border-r"
    >
      <ul className="flex items-center justify-around px-2 py-1 lg:h-svh lg:flex-col lg:justify-start lg:gap-2 lg:py-6">
        {items.map(({ titulo, icon: Icon, to }) => {
          const actual =
            to === '/acompanamientos' && pathname.startsWith('/proyectos/')
          return (
            <li key={titulo}>
              <Link
                to={to}
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

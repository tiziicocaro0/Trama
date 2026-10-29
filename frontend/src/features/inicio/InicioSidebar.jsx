import { BookOpen, CalendarBlank, User, Users } from '@phosphor-icons/react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import Logo from '../../components/ui/Logo.jsx'
import HiloInicio from './HiloInicio.jsx'

const navegacion = [
  { id: '', titulo: 'Acompañamientos', icon: Users },
  { id: 'recursos', titulo: 'Recursos', icon: BookOpen },
  { id: 'calendario', titulo: 'Calendario', icon: CalendarBlank },
  { id: 'perfil', titulo: 'Mi perfil', icon: User },
]

export default function InicioSidebar({ cerrarSesion }) {
  const [params] = useSearchParams()
  const seleccion = params.get('seccion') ?? ''
  const actual = ['guias', 'estrategias', 'comunidad'].includes(seleccion)
    ? 'recursos'
    : seleccion
  return (
    <aside className="flex flex-col border-b border-borde/40 bg-superficie py-6 lg:sticky lg:top-0 lg:min-h-svh lg:w-64 lg:shrink-0 lg:self-start lg:border-0 lg:pt-10 lg:pb-5 xl:w-72 xl:pt-12">
      <div className="flex justify-center px-6">
        <NavLink
          to="/inicio"
          aria-label="TRAMA · Inicio"
          className="block w-32 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario lg:w-28 xl:w-32"
        >
          <Logo />
        </NavLink>
      </div>
      <nav
        aria-label="Navegación principal"
        className="mt-8 px-5 lg:mt-10 lg:px-6 xl:px-7"
      >
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1 lg:gap-1 xl:gap-1.5">
          {navegacion.map((item) => {
            const { id, titulo, icon: Icon } = item
            const seleccionada = id
              ? actual === id
              : !navegacion.some((item) => item.id && item.id === actual)
            return (
              <li key={titulo}>
                <Link
                  to={id ? `/inicio?seccion=${id}` : '/acompanamientos'}
                  aria-current={seleccionada ? 'page' : false}
                  className={`flex min-h-12 flex-col items-center gap-1 rounded-md px-2 py-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario sm:justify-center sm:text-sm lg:flex-row lg:justify-start lg:gap-3 lg:px-3 xl:min-h-13 xl:px-4 xl:text-base ${seleccionada ? 'bg-decoracion font-semibold text-primario' : 'text-texto-suave hover:bg-decoracion/60'}`}
                >
                  <Icon
                    size={24}
                    aria-hidden="true"
                    className="size-6 shrink-0 lg:size-5 xl:size-6"
                  />
                  <span>{titulo}</span>
                  {seleccionada && (
                    <span
                      aria-hidden="true"
                      className="ml-auto hidden size-2 shrink-0 rounded-full bg-miel lg:block"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="mt-6 flex flex-col">
        <p className="px-8 font-display text-subtitulo leading-6 font-bold text-agua">
          Distintas miradas,
          <br />
          una misma persona.
        </p>
        <HiloInicio lateral />
        <div className="mt-6 px-8">
          <button
            type="button"
            aria-label="Cerrar sesión"
            className="block h-11 w-11/12 cursor-pointer rounded-md border-0 bg-decoracion/80 p-0 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none xl:h-12"
            onClick={() => cerrarSesion()}
          >
            <img
              src="/assets/branding/cerrar sesion.png"
              alt=""
              width="2172"
              height="724"
              className="block h-full w-full object-contain"
            />
          </button>
        </div>
      </div>
    </aside>
  )
}

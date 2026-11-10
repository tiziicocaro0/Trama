import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'
import Logo from '../../components/ui/Logo.jsx'
import HiloInicio from './HiloInicio.jsx'
import useAuth from '../../hooks/useAuth.js'
import { navegacionPara } from './navegacion.js'

// Secciones con página propia: se marcan por la ruta, no por ?seccion=.
// 9.2: la institución se abre desde Mi plan; los avisos por mail, desde Mi perfil.
const RUTAS_PROPIAS = {
  plan: ['/cuenta/plan', '/institucion'],
  perfil: ['/perfil', '/cuenta/notificaciones'],
  panel: ['/panel'],
}
const TODAS_LAS_RUTAS_PROPIAS = Object.values(RUTAS_PROPIAS).flat()

export default function InicioSidebar({ cerrarSesion }) {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const navegacion = navegacionPara(usuario)
  const seleccion = params.get('seccion') ?? ''
  const actual = seleccion
  // En el celular el menú se abre con la hamburguesa; en pantallas grandes está siempre.
  const [abierto, setAbierto] = useState(false)
  const botonMenu = useRef(null)
  const botonCerrar = useRef(null)

  function cerrar() {
    setAbierto(false)
    botonMenu.current?.focus()
  }

  useEffect(() => {
    if (!abierto) return undefined
    botonCerrar.current?.focus()
    function alTeclear(event) {
      if (event.key === 'Escape') {
        setAbierto(false)
        botonMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto])

  return (
    <>
      {/* Celular: hamburguesa, logo al centro y la campana (fija, de NotificacionesGlobales) a la derecha */}
      <header className="sticky top-0 z-20 flex h-20 items-center justify-center border-b border-borde/40 bg-superficie lg:hidden">
        <button
          ref={botonMenu}
          type="button"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto(true)}
          className="absolute left-4 flex size-11 items-center justify-center rounded-md text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario"
        >
          <List size={28} aria-hidden="true" />
        </button>
        <NavLink
          to="/inicio"
          aria-label="TRAMA · Inicio"
          className="block w-28 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          <Logo />
        </NavLink>
      </header>
      {abierto && (
        <div
          aria-hidden="true"
          onClick={cerrar}
          className="fixed inset-0 z-40 bg-texto/40 lg:hidden"
        />
      )}
      <aside
        id="menu-principal"
        aria-label="Menú"
        className={`${abierto ? 'fixed inset-y-0 left-0 z-50 flex w-72 max-w-full overflow-y-auto shadow-lg' : 'hidden'} flex-col bg-superficie py-6 lg:sticky lg:top-0 lg:z-auto lg:flex lg:min-h-svh lg:w-64 lg:max-w-none lg:shrink-0 lg:self-start lg:overflow-visible lg:pt-10 lg:pb-5 lg:shadow-none xl:w-72 xl:pt-12`}
      >
      <div className="flex justify-end px-4 lg:hidden">
        <button
          ref={botonCerrar}
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrar}
          className="flex size-11 items-center justify-center rounded-md text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario"
        >
          <X size={28} aria-hidden="true" />
        </button>
      </div>
      <div className="hidden justify-center px-6 lg:flex">
        <NavLink
          to="/inicio"
          aria-label="TRAMA · Inicio"
          className="block w-28 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario xl:w-32"
        >
          <Logo />
        </NavLink>
      </div>
      <nav
        aria-label="Navegación principal"
        className="mt-2 px-5 lg:mt-10 lg:px-6 xl:px-7"
      >
        <ul className="grid grid-cols-1 gap-1 xl:gap-1.5">
          {navegacion.map((item) => {
            const { id, titulo, icon: Icon, to } = item
            const enRutaPropia = TODAS_LAS_RUTAS_PROPIAS.includes(pathname)
            const seleccionada = RUTAS_PROPIAS[id]
              ? RUTAS_PROPIAS[id].includes(pathname)
              : id
                ? !enRutaPropia && actual === id
                : !enRutaPropia &&
                  !navegacion.some((item) => item.id && item.id === actual)
            return (
              <li key={titulo}>
                <Link
                  to={to}
                  onClick={() => setAbierto(false)}
                  aria-current={seleccionada ? 'page' : false}
                  className={`flex min-h-12 items-center gap-3 rounded-md px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario lg:text-sm xl:min-h-13 xl:px-4 xl:text-base ${seleccionada ? 'bg-decoracion font-semibold text-primario' : 'text-texto-suave hover:bg-decoracion/60'}`}
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
                      className="ml-auto size-2 shrink-0 rounded-full bg-miel"
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
    </>
  )
}

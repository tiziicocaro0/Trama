import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import TarjetaPanelNino from './components/TarjetaPanelNino.jsx'
import usePanel from './hooks/usePanel.js'
import useAuth from '../../hooks/useAuth.js'

/**
 * 7.1: Panel de profesionales.
 * Permite ver todos los niños asignados con sus novedades semanales, estado freemium y acceso en 1 toque.
 */
export default function PanelPage() {
  const { cerrarSesion } = useAuth()
  const { ninos, error, noAutorizado, cargando, reintentar } = usePanel()
  const [busqueda, setBusqueda] = useState('')

  const visibles =
    ninos?.filter((nino) =>
      nino.nombre
        .toLocaleLowerCase('es')
        .includes(busqueda.trim().toLocaleLowerCase('es')),
    ) ?? []

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-panel" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-panel"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-4xl">
          <Link
            to="/inicio"
            className="mb-5 inline-flex min-h-11 items-center rounded-sm text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Volver al inicio
          </Link>

          <header className="mb-8 sm:mb-10">
            <h1 className="break-words font-display text-h1 text-secundario sm:text-display">
              Panel de profesionales
            </h1>
            <p className="mt-3 text-base text-texto-suave sm:text-subtitulo">
              Novedades de los últimos 7 días y estado de tus acompañamientos.
            </p>
          </header>

          {cargando ? (
            <p role="status">Cargando tu panel…</p>
          ) : noAutorizado ? (
            <section
              className="rounded-lg bg-superficie p-6"
              aria-labelledby="acceso-restringido"
            >
              <h2
                id="acceso-restringido"
                className="font-display text-h2 text-secundario"
              >
                Acceso exclusivo para profesionales
              </h2>
              <p className="mt-3 text-texto-suave">
                Esta sección está disponible para usuarios con al menos un rol de educación o salud.
              </p>
              <Boton to="/acompanamientos" className="mt-5">
                Ir a acompañamientos
              </Boton>
            </section>
          ) : error ? (
            <div className="space-y-4 rounded-lg bg-superficie p-6">
              <p role="alert">{error}</p>
              <Boton onClick={reintentar}>Reintentar</Boton>
            </div>
          ) : ninos?.length === 0 ? (
            <section
              className="rounded-lg bg-superficie p-6"
              aria-labelledby="sin-ninos"
            >
              <h2
                id="sin-ninos"
                className="font-display text-h2 text-secundario"
              >
                Todavía no tenés niños asignados
              </h2>
              <p className="mt-3 text-texto-suave">
                Cuando formes parte de la red de un niño como profesional, vas a encontrar sus novedades acá.
              </p>
            </section>
          ) : (
            <>
              <div className="mb-6">
                <Campo
                  type="search"
                  aria-label="Buscar niño"
                  placeholder="Buscar niño…"
                  icon={MagnifyingGlass}
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>

              {visibles.length ? (
                <ul aria-label="Tus niños asignados" className="space-y-4">
                  {visibles.map((nino) => (
                    <li key={nino.id}>
                      <TarjetaPanelNino nino={nino} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status">
                  No encontramos niños con ese nombre.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}


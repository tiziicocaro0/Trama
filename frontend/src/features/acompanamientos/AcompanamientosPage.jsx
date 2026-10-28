import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import TarjetaProyecto from './components/TarjetaProyecto.jsx'
import useAcompanamientos from './hooks/useAcompanamientos.js'

export default function AcompanamientosPage() {
  const { cerrarSesion } = useAuth()
  const { proyectos, error, cargando, reintentar } = useAcompanamientos()
  const [busqueda, setBusqueda] = useState('')
  const visibles =
    proyectos?.filter((proyecto) =>
      proyecto.nombre
        .toLocaleLowerCase('es')
        .includes(busqueda.trim().toLocaleLowerCase('es')),
    ) ?? []
  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-acompanamientos" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-acompanamientos"
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
              Acompañamientos
            </h1>
            <p className="mt-3 text-base text-texto-suave sm:text-subtitulo">
              Espacios compartidos para su bienestar.
            </p>
            <Boton to="/acompanamientos/nuevo" className="mt-5">
              Nuevo acompañamiento
            </Boton>
          </header>
          {cargando ? (
            <p role="status">Cargando tus acompañamientos…</p>
          ) : error ? (
            <div className="space-y-4 rounded-lg bg-superficie p-6">
              <p role="alert">{error}</p>
              <Boton onClick={reintentar}>Reintentar</Boton>
            </div>
          ) : proyectos?.length === 0 ? (
            <section
              className="rounded-lg bg-superficie p-6"
              aria-labelledby="sin-acompanamientos"
            >
              <h2
                id="sin-acompanamientos"
                className="font-display text-h2 text-secundario"
              >
                Todavía no tenés acompañamientos
              </h2>
              <p className="mt-3 text-texto-suave">
                Cuando formes parte de un proyecto, lo vas a encontrar acá.
              </p>
            </section>
          ) : (
            <>
              <div className="mb-6">
                <Campo
                  type="search"
                  aria-label="Buscar acompañamiento"
                  placeholder="Buscar acompañamiento…"
                  icon={MagnifyingGlass}
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
              {visibles.length ? (
                <ul aria-label="Tus acompañamientos" className="space-y-5">
                  {visibles.map((proyecto) => (
                    <li key={proyecto.id}>
                      <TarjetaProyecto proyecto={proyecto} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status">
                  No encontramos acompañamientos con ese nombre.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

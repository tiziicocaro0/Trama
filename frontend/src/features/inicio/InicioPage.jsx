import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import InicioSidebar from './InicioSidebar.jsx'
import { Acompanamientos, Eventos, Recursos } from './InicioSecciones.jsx'
import HiloInicio from './HiloInicio.jsx'
import { seccionesFuturas } from './inicio.mock.js'

export default function InicioPage() {
  const { usuario, cerrarSesion } = useAuth()
  const [params] = useSearchParams()
  const seleccion = params.get('seccion')
  const seccion = Object.hasOwn(seccionesFuturas, seleccion)
    ? seccionesFuturas[seleccion]
    : null
  const tituloPendiente = useRef(null)

  useEffect(() => {
    if (seccion) tituloPendiente.current?.focus()
  }, [seccion])

  return (
    <div className="min-h-svh bg-bienvenida-papel text-texto lg:flex">
      <a href="#contenido-inicio" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-inicio"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10 xl:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <p className="text-sm font-bold text-secundario">TU ESPACIO</p>
            <h1
              aria-label={`Hola, ${usuario.nombre}.`}
              className="mt-1 break-words font-display text-h1 leading-tight text-primario sm:text-display lg:text-6xl"
            >
              Hola, {usuario.nombre}
              <span className="text-miel">.</span>
            </h1>
            <p className="mt-2 text-base text-texto-suave sm:text-subtitulo">
              Qué bueno tenerte por acá.
            </p>
            <HiloInicio />
          </header>
          {seccion && (
            <section
              aria-labelledby="seccion-pendiente"
              className="mb-6 rounded-lg border border-borde bg-superficie p-5"
            >
              <h2
                ref={tituloPendiente}
                tabIndex={-1}
                id="seccion-pendiente"
                className="text-subtitulo font-bold text-primario"
              >
                {seccion} · Próximamente
              </h2>
              <p className="mt-2 text-texto-suave">
                Este espacio todavía no está disponible.
              </p>
              <Link
                to="/inicio"
                className="mt-3 inline-flex min-h-11 items-center font-bold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                Volver al inicio
              </Link>
            </section>
          )}
          <p id="aviso-ejemplos" className="mb-3 text-xs text-texto-suave">
            Vista de ejemplo: los acompañamientos y eventos son ficticios y no
            corresponden a tu cuenta.
          </p>
          <Acompanamientos />
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
            <Eventos />
            <Recursos />
          </div>
        </div>
      </main>
    </div>
  )
}

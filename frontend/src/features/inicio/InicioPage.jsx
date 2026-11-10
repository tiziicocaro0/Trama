import { useSearchParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import InicioSidebar from './InicioSidebar.jsx'
import { Acompanamientos, Eventos } from './InicioSecciones.jsx'
import HiloInicio from './HiloInicio.jsx'
import useResumenInicio from './useResumenInicio.js'
import CalendarioUsuarioPage from '../calendario/CalendarioUsuarioPage.jsx'

export default function InicioPage() {
  const { usuario, cerrarSesion } = useAuth()
  const [params] = useSearchParams()
  const seleccion = params.get('seccion')
  // Con el calendario abierto, el resumen no hace falta.
  const resumen = useResumenInicio(seleccion !== 'calendario')

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
          {seleccion === 'calendario' && <CalendarioUsuarioPage />}
          {seleccion !== 'calendario' && <>
            <Acompanamientos resumen={resumen} />
            <div className="mt-4 min-w-0">
              <Eventos resumen={resumen} />
            </div>
          </>}
        </div>
      </main>
    </div>
  )
}

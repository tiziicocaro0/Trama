import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import Boton from '../../components/ui/Boton.jsx'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import ContratarPaquete from './components/ContratarPaquete.jsx'
import PanelInstitucion from './components/PanelInstitucion.jsx'
import useInstitucion from './hooks/useInstitucion.js'

// 9.2: /institucion. Cualquier usuario puede contratar un paquete y queda como responsable.
export default function InstitucionPage() {
  const { cerrarSesion } = useAuth()
  const { pagina, error, cargando, reintentar, actualizar } = useInstitucion()

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-institucion" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-institucion"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            to="/cuenta/plan"
            className="inline-flex min-h-11 items-center rounded-sm text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Volver a Mi plan
          </Link>
          <h1 className="font-display text-h1 text-secundario sm:text-display">
            Institución
          </h1>
          {cargando ? (
            <p role="status">Cargando la institución…</p>
          ) : error ? (
            <div className="space-y-4 rounded-lg bg-superficie p-6">
              <p role="alert">{error}</p>
              <Boton onClick={reintentar}>Reintentar</Boton>
            </div>
          ) : pagina.institucion ? (
            <PanelInstitucion institucion={pagina.institucion} onActualizar={actualizar} />
          ) : (
            <ContratarPaquete paquetes={pagina.paquetes} onContratado={actualizar} />
          )}
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { listarRecursos } from '../../api/archivos.js'
import Boton from '../../components/ui/Boton.jsx'
import Cargando from '../../components/ui/Cargando.jsx'
import ModalSubirRecurso from './components/ModalSubirRecurso.jsx'
import TarjetaRecurso from './components/TarjetaRecurso.jsx'
import VisorRecurso from './components/VisorRecurso.jsx'
import usePerfil from './hooks/usePerfil.js'

// Recursos del niño: galería con los PDF y fotos que sube la red, ya sea directo acá
// o como adjunto de un aporte. Cada uno muestra dónde se cargó y quién lo subió.
export default function RecursosPage() {
  const { id } = useParams()
  const { proyecto, datos: recursos, cargando, error, reintentar } = usePerfil(id, listarRecursos)
  const [abierto, setAbierto] = useState(null)
  const [subiendo, setSubiendo] = useState(false)

  function recargar() {
    setAbierto(null)
    setSubiendo(false)
    reintentar()
  }

  return (
    <main tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-6 text-texto sm:px-8 sm:pb-10">
      {cargando ? (
        <Cargando mensaje="Cargando los recursos…" />
      ) : error ? (
        <div className="space-y-4">
          <h1 className="font-display text-h1 text-secundario">No pudimos mostrar los recursos</h1>
          <p role="alert">{error}</p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      ) : (
        proyecto && (
          <section aria-labelledby="titulo-recursos">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="titulo-recursos" className="font-display text-h1 text-secundario">
                  Recursos
                </h2>
                <p className="mt-2 text-texto-suave">
                  PDF y fotos que la red comparte sobre {proyecto.apodo || proyecto.nombre}.
                </p>
              </div>
              {proyecto.puedeCargar && <Boton onClick={() => setSubiendo(true)}>Subir recurso</Boton>}
            </div>

            {recursos?.length ? (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {recursos.map((recurso) => (
                  <li key={recurso.archivoId}>
                    <TarjetaRecurso proyectoId={id} recurso={recurso} onAbrir={setAbierto} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-superficie p-6 text-texto-suave">
                Todavía no hay recursos. Los PDF y fotos que se suban acá o en los aportes van a aparecer en
                esta galería.
              </p>
            )}
          </section>
        )
      )}

      {abierto && (
        <VisorRecurso
          proyectoId={id}
          recurso={abierto}
          onCerrar={() => setAbierto(null)}
          onArchivado={recargar}
        />
      )}
      {subiendo && (
        <ModalSubirRecurso proyectoId={id} onCerrar={() => setSubiendo(false)} onSubido={recargar} />
      )}
    </main>
  )
}

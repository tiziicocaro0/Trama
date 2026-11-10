import { House, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { archivarAporte, listarAportes } from '../../api/aportes.js'
import { avisar, avisarError } from '../../components/avisos/avisosFlotantes.js'
import Boton from '../../components/ui/Boton.jsx'
import Cargando from '../../components/ui/Cargando.jsx'
import TarjetaAporte from '../../components/ui/TarjetaAporte.jsx'
import FormularioSugerencia from './components/FormularioSugerencia.jsx'
import usePerfil from './hooks/usePerfil.js'
import { leerDatosAporte } from './perfil.js'

// Las sugerencias y los intereses del niño, para vincularlas y filtrarlas
async function cargarEnCasa(proyectoId, signal) {
  const [sugerencias, intereses] = await Promise.all([
    listarAportes(proyectoId, { tipo: 'SUGERENCIA', signal }),
    listarAportes(proyectoId, { tipo: 'INTERES', signal }),
  ])
  return { sugerencias: sugerencias.aportes, intereses: intereses.aportes }
}

const claseFiltro = (activo) =>
  `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primario ${activo ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-secundario hover:bg-decoracion'}`

// 7.2: actividades para hacer en casa que cargan los profesionales, cada una vinculada a
// un interés del niño. La familia las ve todas y puede filtrar por interés.
export default function EnCasaPage() {
  const { id } = useParams()
  const { proyecto, datos, cargando, error, reintentar } = usePerfil(id, cargarEnCasa)
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState(null)

  const sugerencias = datos?.sugerencias ?? []
  const intereses = datos?.intereses ?? []
  const nombreInteres = (interesId) => intereses.find((interes) => interes.id === interesId)?.titulo
  const interesDe = (sugerencia) => leerDatosAporte(sugerencia.datos).interesId
  // Solo se ofrecen como filtro los intereses que tienen alguna sugerencia
  const conSugerencias = intereses.filter((interes) => sugerencias.some((s) => interesDe(s) === interes.id))
  const visibles = filtro ? sugerencias.filter((s) => interesDe(s) === filtro) : sugerencias
  const puedeSugerir = Boolean(proyecto?.puedeCargarNotas)

  function alGuardar() {
    setEditando(null)
    avisar('Listo. La sugerencia quedó en En casa.')
    reintentar()
  }

  async function archivar(sugerencia) {
    try {
      await archivarAporte(id, sugerencia.id)
      avisar('Archivamos la sugerencia.')
      reintentar()
    } catch (errorArchivo) {
      avisarError(errorArchivo.message)
    }
  }

  return (
    <main tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-6 text-texto focus:outline-none sm:px-8 sm:pb-10">
      {cargando ? (
        <Cargando mensaje="Cargando las sugerencias…" />
      ) : error ? (
        <div className="space-y-4">
          <h1 className="font-display text-h1 text-secundario">No pudimos mostrar las sugerencias</h1>
          <p role="alert">{error}</p>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      ) : (
        <section aria-labelledby="titulo-en-casa" className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h2 id="titulo-en-casa" className="font-display text-h1 text-secundario">En casa</h2>
              <p className="mt-1 text-texto-suave">
                Actividades que sugiere el equipo profesional para hacer en casa, a partir de lo que le gusta a {proyecto?.apodo || proyecto?.nombre}.
              </p>
            </div>
            {puedeSugerir && !editando && (
              <Boton tamano="chico" onClick={() => setEditando({})}>
                <Plus size={18} aria-hidden="true" />
                Sugerir actividad
              </Boton>
            )}
          </div>

          {editando && (
            <FormularioSugerencia
              key={editando.id ?? 'nueva'}
              proyectoId={id}
              intereses={intereses}
              sugerencia={editando.id ? editando : null}
              alGuardar={alGuardar}
              alCancelar={() => setEditando(null)}
            />
          )}

          {conSugerencias.length > 0 && (
            <div role="group" aria-label="Filtrar por interés" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!filtro} onClick={() => setFiltro('')} className={claseFiltro(!filtro)}>Todas</button>
              {conSugerencias.map((interes) => (
                <button key={interes.id} type="button" aria-pressed={filtro === interes.id} onClick={() => setFiltro(interes.id)} className={claseFiltro(filtro === interes.id)}>
                  {interes.titulo}
                </button>
              ))}
            </div>
          )}

          {visibles.length ? (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibles.map((sugerencia) => {
                const datosSugerencia = leerDatosAporte(sugerencia.datos)
                return (
                  <li key={sugerencia.id} className="rounded-lg bg-superficie p-5 shadow-sm">
                    <TarjetaAporte
                      aporte={sugerencia}
                      alEditar={() => setEditando(sugerencia)}
                      alArchivar={() => archivar(sugerencia)}
                      detalle={
                        <div className="space-y-1 text-sm">
                          {nombreInteres(datosSugerencia.interesId) && (
                            <p className="inline-flex items-center gap-2 rounded-full bg-miel/15 px-3 py-1 font-semibold text-secundario">
                              Le gusta: {nombreInteres(datosSugerencia.interesId)}
                            </p>
                          )}
                          {datosSugerencia.materiales && <p className="text-texto-suave"><span className="font-semibold text-texto">Materiales:</span> {datosSugerencia.materiales}</p>}
                        </div>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-superficie p-6 text-texto-suave">
              <House size={24} aria-hidden="true" className="shrink-0 text-primario" />
              <p>
                {puedeSugerir
                  ? 'Todavía no hay sugerencias. Sumá una actividad vinculada a algo que le guste.'
                  : 'Todavía no hay sugerencias del equipo profesional.'}
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

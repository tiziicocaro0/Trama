import { Lock } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listarBitacora } from '../../api/aportes.js'
import { listarMiembros } from '../../api/miembros.js'
import Boton from '../../components/ui/Boton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { formatearFechaHora } from '../../utils/fechas.js'
import CabeceraPerfil from '../perfil/components/CabeceraPerfil.jsx'
import NavegacionPerfil from '../perfil/components/NavegacionPerfil.jsx'
import usePerfil from '../perfil/hooks/usePerfil.js'
import {
  ETIQUETAS_CONTEXTO,
  ETIQUETAS_TAG,
  leerDatosObservacion,
  ordenarObservacionesPorFecha,
  resolverNombreAutor,
} from './bitacora.js'
import FormularioObservacion from './components/FormularioObservacion.jsx'

export default function BitacoraPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [observacionEnEdicion, setObservacionEnEdicion] = useState(null)
  const [mensajeGuardado, setMensajeGuardado] = useState('')

  const cargarBitacoraYMiembros = useCallback(async (proyectoId, signal) => {
    const [observaciones, miembros] = await Promise.all([
      listarBitacora(proyectoId, signal),
      listarMiembros(proyectoId, signal).catch(() => []),
    ])
    return { observaciones, miembros }
  }, [])

  const { proyecto, datos, cargando, error, reintentar } = usePerfil(
    id,
    cargarBitacoraYMiembros,
  )

  const observacionesOrdenadas = ordenarObservacionesPorFecha(
    datos?.observaciones ?? [],
  )
  const miembros = datos?.miembros ?? []
  const puedeCrear = proyecto?.puedeCargar === true

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-fondo px-4 py-6 text-texto sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando ? (
          <p role="status">Cargando la bitácora…</p>
        ) : error ? (
          <div className="space-y-4 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar la bitácora
            </h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={reintentar}>Reintentar</Boton>
              <Boton to={`/proyectos/${id}`} variant="secondary">
                Volver al perfil
              </Boton>
            </div>
          </div>
        ) : (
          proyecto && (
            <>
              <CabeceraPerfil
                proyecto={proyecto}
                seccion={{ titulo: 'Bitácora' }}
              />
              <NavegacionPerfil proyectoId={id} />

              <section aria-labelledby="titulo-bitacora">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      id="titulo-bitacora"
                      className="font-display text-h1 text-secundario"
                    >
                      Bitácora
                    </h2>
                    <p className="mt-1 text-texto-suave">
                      Observaciones fechadas con contexto y etiquetas, ordenadas
                      de la más nueva a la más antigua.
                    </p>
                  </div>

                  {puedeCrear &&
                    !mostrandoFormulario &&
                    !observacionEnEdicion && (
                      <Boton
                        onClick={() => {
                          setMensajeGuardado('')
                          setMostrandoFormulario(true)
                        }}
                      >
                        Nueva observación
                      </Boton>
                    )}
                </div>

                {mensajeGuardado && (
                  <p role="status" className="mb-4 text-secundario">
                    {mensajeGuardado}
                  </p>
                )}

                {(mostrandoFormulario || observacionEnEdicion) && (
                  <FormularioObservacion
                    proyectoId={id}
                    observacion={observacionEnEdicion}
                    alGuardar={() => {
                      setMostrandoFormulario(false)
                      setObservacionEnEdicion(null)
                      setMensajeGuardado('Observación guardada.')
                      reintentar()
                    }}
                    alCancelar={() => {
                      setMostrandoFormulario(false)
                      setObservacionEnEdicion(null)
                    }}
                  />
                )}

                {observacionesOrdenadas.length > 0 ? (
                  <div className="space-y-4">
                    {observacionesOrdenadas.map((observacion) => {
                      const info = leerDatosObservacion(observacion.datos)
                      const fechaIso = info.fecha ?? observacion.creadoEn
                      const fechaTexto = formatearFechaHora(fechaIso)
                      const contextoTexto =
                        ETIQUETAS_CONTEXTO[info.contexto] ??
                        info.contexto ??
                        'Sin contexto'
                      const autorTexto = resolverNombreAutor(
                        observacion,
                        miembros,
                        usuario,
                      )
                      const esRestringido =
                        observacion.visibilidad != null &&
                        observacion.visibilidad !== 'TODOS'

                      return (
                        <article
                          key={observacion.id}
                          className="rounded-lg bg-superficie p-6 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-texto-suave">
                            <p className="font-semibold text-secundario">
                              <span>Autor: </span>
                              <span>{autorTexto}</span>
                            </p>
                            <div className="flex items-center gap-2">
                              {fechaTexto ? (
                                <time dateTime={fechaIso}>{fechaTexto}</time>
                              ) : (
                                <span>Fecha no disponible</span>
                              )}
                              {esRestringido && (
                                <Lock
                                  size={18}
                                  weight="regular"
                                  className="shrink-0 text-secundario"
                                  role="img"
                                  aria-label="Visibilidad restringida"
                                />
                              )}
                            </div>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap break-words text-base text-texto">
                            {observacion.contenido || observacion.titulo}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-secundario px-3 py-1 text-xs font-semibold text-superficie">
                              {contextoTexto}
                            </span>
                            {info.etiquetas.map((etiquetaCodigo) => (
                              <span
                                key={etiquetaCodigo}
                                className="inline-flex items-center rounded-full bg-miel/30 px-3 py-1 text-xs font-semibold text-texto"
                              >
                                {ETIQUETAS_TAG[etiquetaCodigo] ??
                                  etiquetaCodigo}
                              </span>
                            ))}
                          </div>

                          {observacion.puedeEditar &&
                            !mostrandoFormulario &&
                            !observacionEnEdicion && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMensajeGuardado('')
                                  setObservacionEnEdicion(observacion)
                                }}
                                aria-label={`Editar observación: ${observacion.titulo}`}
                                className="mt-3 inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
                              >
                                Editar
                              </button>
                            )}
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-superficie p-6 text-texto-suave">
                    Todavía no hay observaciones en la bitácora.
                  </p>
                )}
              </section>
            </>
          )
        )}
      </div>
    </main>
  )
}


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
  FILTROS_INICIALES_BITACORA,
  filtrarObservaciones,
  leerDatosObservacion,
  ordenarObservacionesPorFecha,
  resolverNombreAutor,
  TAMANIO_PAGINA_BITACORA,
} from './bitacora.js'
import BarraFiltrosBitacora from './components/BarraFiltrosBitacora.jsx'
import FormularioObservacion from './components/FormularioObservacion.jsx'

export default function BitacoraPage() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES_BITACORA)
  const [observacionesExtra, setObservacionesExtra] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [ultimaTandaCantidad, setUltimaTandaCantidad] = useState(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [observacionEnEdicion, setObservacionEnEdicion] = useState(null)
  const [mensajeGuardado, setMensajeGuardado] = useState('')

  const cargarBitacoraYMiembros = useCallback(
    async (proyectoId, signal) => {
      const [observaciones, miembros] = await Promise.all([
        listarBitacora(proyectoId, { ...filtros, pagina: 0, signal }),
        listarMiembros(proyectoId, signal).catch(() => []),
      ])
      return { observaciones, miembros }
    },
    [filtros],
  )

  const { proyecto, datos, cargando, error, reintentar } = usePerfil(
    id,
    cargarBitacoraYMiembros,
  )

  function actualizarFiltro(campo, valor) {
    setObservacionesExtra([])
    setPaginaActual(0)
    setUltimaTandaCantidad(null)
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function limpiarFiltros() {
    setObservacionesExtra([])
    setPaginaActual(0)
    setUltimaTandaCantidad(null)
    setFiltros(FILTROS_INICIALES_BITACORA)
  }

  async function cargarMas() {
    if (cargandoMas) return
    const siguientePagina = paginaActual + 1
    setCargandoMas(true)
    try {
      const nuevas = await listarBitacora(id, {
        ...filtros,
        pagina: siguientePagina,
      })
      setObservacionesExtra((previas) => {
        const idsExistentes = new Set(
          [...(datos?.observaciones ?? []), ...previas].map((item) => item.id),
        )
        const sinDuplicados = nuevas.filter(
          (item) => !idsExistentes.has(item.id),
        )
        return [...previas, ...sinDuplicados]
      })
      setPaginaActual(siguientePagina)
      setUltimaTandaCantidad(nuevas.length)
    } finally {
      setCargandoMas(false)
    }
  }

  const baseObservaciones = datos?.observaciones ?? []
  const todasCombinadas = [...baseObservaciones, ...observacionesExtra]
  const observacionesOrdenadas = ordenarObservacionesPorFecha(
    filtrarObservaciones(todasCombinadas, filtros),
  )
  const miembros = datos?.miembros ?? []
  const puedeCrear = proyecto?.puedeCargar === true
  const cantidadUltimaPagina =
    ultimaTandaCantidad ?? baseObservaciones.length
  const hayMasPaginas = cantidadUltimaPagina >= TAMANIO_PAGINA_BITACORA

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-fondo px-4 py-6 text-texto sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando && !proyecto ? (
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

                {!mostrandoFormulario && !observacionEnEdicion && (
                  <BarraFiltrosBitacora
                    filtros={filtros}
                    miembros={miembros}
                    alCambiarFiltro={actualizarFiltro}
                    alLimpiar={limpiarFiltros}
                  />
                )}

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
                      setObservacionesExtra([])
                      setPaginaActual(0)
                      setUltimaTandaCantidad(null)
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
                        </article>
                      )
                    })}

                    {hayMasPaginas && (
                      <div className="pt-2 text-center">
                        <Boton
                          variant="secondary"
                          onClick={cargarMas}
                          disabled={cargandoMas}
                        >
                          {cargandoMas ? 'Cargando…' : 'Ver más'}
                        </Boton>
                      </div>
                    )}
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

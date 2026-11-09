import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { listarAportes, listarBitacora } from '../../api/aportes.js'
import { listarMiembros } from '../../api/miembros.js'
import Boton from '../../components/ui/Boton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import usePerfil from '../perfil/hooks/usePerfil.js'
import {
  esRegistroAbc,
  FILTROS_INICIALES_BITACORA,
  filtrarObservaciones,
  ordenarObservacionesPorFecha,
  resolverNombreAutor,
  TAMANIO_PAGINA_BITACORA,
} from './bitacora.js'
import BarraFiltrosBitacora from './components/BarraFiltrosBitacora.jsx'
import FormularioAbc from './components/FormularioAbc.jsx'
import FormularioObservacion from './components/FormularioObservacion.jsx'
import TarjetaAbc from './components/TarjetaAbc.jsx'
import TarjetaObservacion from './components/TarjetaObservacion.jsx'
import Cargando from '../../components/ui/Cargando.jsx'

export default function BitacoraPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const aporteBuscado = params.get('aporte')
  const [seleccionado, setSeleccionado] = useState(null)
  const { usuario } = useAuth()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES_BITACORA)
  const [observacionesExtra, setObservacionesExtra] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [ultimaTandaCantidad, setUltimaTandaCantidad] = useState(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false)
  const [observacionEnEdicion, setObservacionEnEdicion] = useState(null)
  const [mostrandoAbc, setMostrandoAbc] = useState(false)
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

  useEffect(() => {
    if (!aporteBuscado) return undefined
    const controller = new AbortController()
    listarAportes(id, controller.signal).then(
      ({ aportes }) => {
        if (!controller.signal.aborted) setSeleccionado({ proyectoId: id, id: aporteBuscado, aporte: aportes.find((item) => item.id === aporteBuscado && ['OBSERVACION', 'ABC'].includes(item.tipo)) })
      },
      () => { if (!controller.signal.aborted) setSeleccionado({ proyectoId: id, id: aporteBuscado, error: true }) },
    )
    return () => controller.abort()
  }, [id, aporteBuscado])

  useEffect(() => {
    if (!aporteBuscado || !datos || seleccionado?.proyectoId !== id || seleccionado?.id !== aporteBuscado) return
    const elemento = document.getElementById(`aporte-${aporteBuscado}`)
    elemento?.scrollIntoView?.({ block: 'center' })
    elemento?.focus({ preventScroll: true })
  }, [id, aporteBuscado, datos, seleccionado])

  function reiniciarPaginas() {
    setObservacionesExtra([])
    setPaginaActual(0)
    setUltimaTandaCantidad(null)
  }

  function actualizarFiltro(campo, valor) {
    reiniciarPaginas()
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function limpiarFiltros() {
    reiniciarPaginas()
    setFiltros(FILTROS_INICIALES_BITACORA)
  }

  function recargarTrasGuardar(mensaje) {
    setMostrandoFormulario(false)
    setObservacionEnEdicion(null)
    setMostrandoAbc(false)
    reiniciarPaginas()
    setMensajeGuardado(mensaje)
    reintentar()
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
  const seleccionVigente = seleccionado?.proyectoId === id && seleccionado?.id === aporteBuscado
  if (seleccionVigente && seleccionado.aporte && !todasCombinadas.some((item) => item.id === aporteBuscado)) todasCombinadas.push(seleccionado.aporte)
  const observacionesOrdenadas = ordenarObservacionesPorFecha(
    filtrarObservaciones(todasCombinadas, filtros),
  )
  const miembros = datos?.miembros ?? []
  const puedeCrear = proyecto?.puedeCargar === true
  // 4.4: el registro ABC lo cargan los profesionales (misma regla que las notas)
  const puedeCrearAbc = proyecto?.puedeCargarNotas === true
  const hayFormularioAbierto =
    mostrandoFormulario || Boolean(observacionEnEdicion) || mostrandoAbc
  const cantidadUltimaPagina =
    ultimaTandaCantidad ?? baseObservaciones.length
  const hayMasPaginas = cantidadUltimaPagina >= TAMANIO_PAGINA_BITACORA

  return (
    <main
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 pb-6 text-texto sm:px-8 sm:pb-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando && !proyecto ? (
          <Cargando mensaje="Cargando la bitácora…" />
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
                      Observaciones y registros ABC fechados, ordenados de la
                      más nueva a la más antigua.
                    </p>
                  </div>

                  {!hayFormularioAbierto && (puedeCrear || puedeCrearAbc) && (
                    <div className="flex flex-wrap gap-3">
                      {puedeCrearAbc && (
                        <Boton
                          variant="secondary"
                          onClick={() => {
                            setMensajeGuardado('')
                            setMostrandoAbc(true)
                          }}
                        >
                          Registro ABC
                        </Boton>
                      )}
                      {puedeCrear && (
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
                  )}
                </div>

                {!hayFormularioAbierto && (
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
                {aporteBuscado && !seleccionVigente && <p role="status">Buscando el aporte…</p>}
                {aporteBuscado && seleccionVigente && !seleccionado.aporte && <p role="alert">No encontramos este aporte o ya no está disponible.</p>}

                {(mostrandoFormulario || observacionEnEdicion) && (
                  <FormularioObservacion
                    proyectoId={id}
                    observacion={observacionEnEdicion}
                    alGuardar={() => recargarTrasGuardar('Observación guardada.')}
                    alCancelar={() => {
                      setMostrandoFormulario(false)
                      setObservacionEnEdicion(null)
                    }}
                  />
                )}

                {mostrandoAbc && (
                  <FormularioAbc
                    proyectoId={id}
                    alGuardar={() => recargarTrasGuardar('Registro ABC guardado.')}
                    alCancelar={() => setMostrandoAbc(false)}
                  />
                )}

                {observacionesOrdenadas.length > 0 ? (
                  <div className="space-y-4">
                    {observacionesOrdenadas.map((aporte) => {
                      const autorTexto = resolverNombreAutor(
                        aporte,
                        miembros,
                        usuario,
                      )
                      return <div key={aporte.id} id={`aporte-${aporte.id}`} tabIndex={-1}>{esRegistroAbc(aporte) ? (
                        <TarjetaAbc
                          registro={aporte}
                          autorTexto={autorTexto}
                        />
                      ) : (
                        <TarjetaObservacion
                          observacion={aporte}
                          autorTexto={autorTexto}
                        />
                      )}</div>
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

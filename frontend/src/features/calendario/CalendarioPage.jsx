import {
  CalendarBlank,
  Clock,
  FileImage,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  descargarArchivo,
  obtenerUrlDescargaArchivo,
} from '../../api/archivos.js'
import {
  crearEvento,
  editarEvento,
  eliminarEvento,
  listarEventos,
} from '../../api/eventos.js'
import { listarMiembros } from '../../api/miembros.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import Boton from '../../components/ui/Boton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import {
  normalizarRolProyecto,
  useProyectoActual,
} from '../../hooks/useProyectoActual.js'
import { formatearFechaCalendario } from '../../utils/fechas.js'
import CabeceraPerfil from '../perfil/components/CabeceraPerfil.jsx'
import NavegacionPerfil from '../perfil/components/NavegacionPerfil.jsx'
import usePerfil from '../perfil/hooks/usePerfil.js'
import ModalEvento from './components/ModalEvento.jsx'

const RANGO_INICIAL = {
  desde: '2026-01-01',
  hasta: '2027-12-31',
}

function formatearHora(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return ''
  return valor.trim().slice(0, 5)
}

function resolverAutorEvento(autorId, miembros) {
  if (!autorId || !Array.isArray(miembros)) return null
  const encontrado = miembros.find(
    (m) => m.usuarioId === autorId || m.id === autorId,
  )
  if (!encontrado) return null
  return [encontrado.nombre, encontrado.apellido].filter(Boolean).join(' ').trim()
}

export default function CalendarioPage() {
  const { id: idRuta } = useParams()
  const { proyectoActual, rol: rolSelector } = useProyectoActual()
  const proyectoId = idRuta || proyectoActual?.id || ''

  const auth = useAuth()
  const usuario = auth?.usuario ?? auth
  const rolUsuario = auth?.rol ?? usuario?.rol ?? rolSelector

  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  const cargarCalendario = useCallback(async (idProyecto, signal) => {
    const [eventos, miembros] = await Promise.all([
      listarEventos(idProyecto, {
        desde: RANGO_INICIAL.desde,
        hasta: RANGO_INICIAL.hasta,
        signal,
      }),
      listarMiembros(idProyecto, signal).catch(() => []),
    ])
    return { eventos, miembros }
  }, [])

  const { proyecto, datos, cargando, error, reintentar } = usePerfil(
    proyectoId,
    cargarCalendario,
  )

  const eventos = datos?.eventos ?? []
  const miembros = datos?.miembros ?? []

  const miembroActual = miembros.find(
    (persona) =>
      Boolean(usuario?.id) &&
      (persona.usuarioId === usuario.id || persona.id === usuario.id),
  )

  const esTutor =
    miembroActual?.rol === 'TUTOR' ||
    normalizarRolProyecto(rolUsuario) === 'TUTOR'

  function puedeModificarEvento(evento) {
    if (esTutor) return true
    return Boolean(usuario?.id && evento?.autorId === usuario.id)
  }

  function abrirNuevoEvento() {
    setErrorAccion('')
    setMensajeExito('')
    setEventoEnEdicion(null)
    setModalAbierto(true)
  }

  function abrirEditarEvento(evento) {
    setErrorAccion('')
    setMensajeExito('')
    setEventoEnEdicion(evento)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setEventoEnEdicion(null)
  }

  async function manejarGuardarEvento(datosFormulario) {
    setErrorAccion('')
    if (eventoEnEdicion?.id) {
      await editarEvento(proyectoId, eventoEnEdicion.id, datosFormulario)
      setMensajeExito('Evento actualizado correctamente.')
    } else {
      await crearEvento(proyectoId, datosFormulario)
      setMensajeExito('Evento creado correctamente.')
    }
    reintentar()
  }

  async function manejarEliminarEvento(evento) {
    if (eliminandoId) return
    setEliminandoId(evento.id)
    setErrorAccion('')
    setMensajeExito('')
    try {
      await eliminarEvento(proyectoId, evento.id)
      setMensajeExito('Evento eliminado correctamente.')
      reintentar()
    } catch (err) {
      setErrorAccion(
        err?.message ||
          'No pudimos eliminar el evento. Intentá nuevamente.',
      )
    } finally {
      setEliminandoId(null)
    }
  }

  async function manejarDescargaImagen(e, evento) {
    if (!evento?.imagenId) return
    e.preventDefault()
    try {
      await descargarArchivo(
        proyectoId,
        evento.imagenId,
        `imagen-${evento.titulo || 'evento'}`,
      )
    } catch {
      // No interrumpe la vista si falla la descarga programática
    }
  }

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-fondo px-4 py-6 text-texto sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        {!proyectoId ? (
          <div className="space-y-4 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">Calendario</h1>
            <p className="text-texto-suave">
              Elegí un acompañamiento para consultar y cargar eventos en su
              calendario.
            </p>
            <Boton to="/acompanamientos">Ir a acompañamientos</Boton>
          </div>
        ) : cargando && !proyecto ? (
          <p role="status">Cargando el calendario…</p>
        ) : error ? (
          <div className="space-y-4 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar el calendario
            </h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={reintentar}>Reintentar</Boton>
              <Boton to={`/proyectos/${proyectoId}`} variant="secondary">
                Volver al perfil
              </Boton>
            </div>
          </div>
        ) : (
          proyecto && (
            <>
              <CabeceraPerfil
                proyecto={proyecto}
                seccion={{ titulo: 'Calendario' }}
              />
              <NavegacionPerfil proyectoId={proyectoId} />

              <section aria-labelledby="titulo-calendario">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      id="titulo-calendario"
                      className="font-display text-h1 text-secundario"
                    >
                      Calendario
                    </h2>
                    <p className="mt-1 text-texto-suave">
                      Eventos y actividades para tener presentes en la red de{' '}
                      {proyecto.nombre}.
                    </p>
                  </div>

                  <Boton onClick={abrirNuevoEvento}>
                    <Plus size={18} aria-hidden="true" />
                    Nuevo evento
                  </Boton>
                </div>

                {mensajeExito && (
                  <div className="mb-6">
                    <Aviso tipo="exito">{mensajeExito}</Aviso>
                  </div>
                )}

                {errorAccion && (
                  <div className="mb-6">
                    <Aviso tipo="error">{errorAccion}</Aviso>
                  </div>
                )}

                {eventos.length > 0 ? (
                  <div className="space-y-4">
                    {eventos.map((evento) => {
                      const fechaVisible =
                        evento.fechaOcurrencia || evento.fecha
                      const fechaFormateada =
                        formatearFechaCalendario(fechaVisible) || fechaVisible
                      const inicio = formatearHora(evento.horaInicio)
                      const fin = formatearHora(evento.horaFin)
                      const autorNombre = resolverAutorEvento(
                        evento.autorId,
                        miembros,
                      )
                      const puedeModificar = puedeModificarEvento(evento)
                      const claveEvento = `${evento.id}-${fechaVisible}`

                      return (
                        <article
                          key={claveEvento}
                          className="rounded-lg border border-borde bg-superficie p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words font-display text-h2 text-secundario">
                                {evento.titulo}
                              </h3>

                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-primario">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarBlank
                                    size={18}
                                    aria-hidden="true"
                                  />
                                  <time dateTime={fechaVisible}>
                                    {fechaFormateada}
                                  </time>
                                </span>

                                {(inicio || fin) && (
                                  <span className="inline-flex items-center gap-1.5 text-secundario">
                                    <Clock size={18} aria-hidden="true" />
                                    <span>
                                      {inicio && fin
                                        ? `${inicio} a ${fin}`
                                        : inicio || fin}
                                    </span>
                                  </span>
                                )}
                              </div>

                              {evento.descripcion && (
                                <p className="mt-3 whitespace-pre-wrap break-words text-texto">
                                  {evento.descripcion}
                                </p>
                              )}

                              {evento.imagenId && (
                                <div className="mt-3">
                                  <a
                                    href={obtenerUrlDescargaArchivo(
                                      proyectoId,
                                      evento.imagenId,
                                    )}
                                    download={`imagen-${evento.titulo}`}
                                    onClick={(e) =>
                                      manejarDescargaImagen(e, evento)
                                    }
                                    className="inline-flex items-center gap-2 rounded-sm border border-borde bg-fondo px-3 py-1.5 text-sm font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                                  >
                                    <FileImage
                                      size={18}
                                      aria-hidden="true"
                                      className="shrink-0 text-primario"
                                    />
                                    <span>Imagen del evento</span>
                                  </a>
                                </div>
                              )}

                              {autorNombre && (
                                <p className="mt-3 text-xs text-texto-suave">
                                  Cargado por: {autorNombre}
                                </p>
                              )}
                            </div>

                            {puedeModificar && (
                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Boton
                                  variant="secondary"
                                  onClick={() => abrirEditarEvento(evento)}
                                  aria-label={`Editar ${evento.titulo}`}
                                >
                                  <PencilSimple
                                    size={16}
                                    aria-hidden="true"
                                  />
                                  Editar
                                </Boton>
                                <Boton
                                  variant="danger"
                                  onClick={() => manejarEliminarEvento(evento)}
                                  disabled={eliminandoId === evento.id}
                                  aria-label={`Eliminar ${evento.titulo}`}
                                >
                                  <Trash size={16} aria-hidden="true" />
                                  {eliminandoId === evento.id
                                    ? 'Eliminando…'
                                    : 'Eliminar'}
                                </Boton>
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg bg-superficie p-6 text-texto-suave">
                    Todavía no hay eventos cargados en el calendario.
                  </p>
                )}
              </section>

              <ModalEvento
                abierto={modalAbierto}
                proyectoId={proyectoId}
                evento={eventoEnEdicion}
                onCerrar={cerrarModal}
                onGuardar={manejarGuardarEvento}
              />
            </>
          )
        )}
      </div>
    </main>
  )
}


import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { descargarArchivo } from '../../api/archivos.js'
import {
  cancelarOcurrenciaEvento,
  crearEvento,
  editarEvento,
  editarOcurrenciaEvento,
  eliminarEvento,
  guardarActaReunion,
  listarEventos,
} from '../../api/eventos.js'
import { listarMiembros } from '../../api/miembros.js'
import Boton from '../../components/ui/Boton.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import {
  normalizarRolProyecto,
  useProyectoActual,
} from '../../hooks/useProyectoActual.js'
import usePerfil from '../perfil/hooks/usePerfil.js'
import ModalAlcanceRecurrente from './components/ModalAlcanceRecurrente.jsx'
import ModalEvento from './components/ModalEvento.jsx'
import CabeceraCalendario from './components/CabeceraCalendario.jsx'
import PanelCalendario from './components/PanelCalendario.jsx'
import VistaCalendario from './components/VistaCalendario.jsx'
import { hoyIso } from '../../utils/fechas.js'
import { esFechaIsoValida, eventosDelDia, moverPeriodo, obtenerPeriodo } from './utils/periodo.js'
import { avisar, avisarError } from '../../components/avisos/avisosFlotantes.js'
import { claveBorradorNuevo, leerBorrador } from './utils/borradores.js'

export default function CalendarioPage() {
  const { id: idRuta } = useParams()
  const [searchParams] = useSearchParams()
  const fechaConsulta = searchParams.get('fecha')
  const fechaInicial = esFechaIsoValida(fechaConsulta) ? fechaConsulta : hoyIso()
  const { proyectoActual, rol: rolSelector } = useProyectoActual()
  const proyectoId = idRuta || proyectoActual?.id || ''

  const auth = useAuth()
  const usuario = auth?.usuario ?? auth
  const rolUsuario = auth?.rol ?? usuario?.rol ?? rolSelector

  const [modalAbierto, setModalAbierto] = useState(false)
  const [vista, setVista] = useState('semana')
  const [referencia, setReferencia] = useState(fechaInicial)
  const [diaSeleccionado, setDiaSeleccionado] = useState(fechaInicial)
  const [panelDia, setPanelDia] = useState(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [fechaNuevoEvento, setFechaNuevoEvento] = useState(null)
  const [horaNuevoEvento, setHoraNuevoEvento] = useState(null)
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null)
  const [alcanceEdicion, setAlcanceEdicion] = useState('serie')
  const [dialogoAlcance, setDialogoAlcance] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const periodo = obtenerPeriodo(vista, referencia)

  const cargarCalendario = useCallback(async (idProyecto, signal) => {
    const [eventos, miembros] = await Promise.all([
      listarEventos(idProyecto, { desde: periodo.desde, hasta: periodo.hasta, signal }),
      listarMiembros(idProyecto, signal).catch(() => []),
    ])
    return { eventos, miembros }
  }, [periodo.desde, periodo.hasta])

  const { proyecto, datos, cargando, error, reintentar } = usePerfil(proyectoId, cargarCalendario)
  const eventos = datos?.eventos ?? []
  const miembros = datos?.miembros ?? []

  const miembroActual = miembros.find(
    (persona) => Boolean(usuario?.id) && (persona.usuarioId === usuario.id || persona.id === usuario.id),
  )
  const esTutor = miembroActual?.rol === 'TUTOR' || normalizarRolProyecto(rolUsuario) === 'TUTOR'

  function puedeModificarEvento(evento) {
    if (typeof evento?.puedeEditar === 'boolean') return evento.puedeEditar
    if (esTutor) return true
    return Boolean(usuario?.id && evento?.autorId === usuario.id)
  }

  function puedeEditarActa(evento) {
    if (evento.tipo !== 'REUNION') return false
    const idUsuario = usuario?.id
    if (!idUsuario) return false
    if (evento.autorId === idUsuario) return true
    if (Array.isArray(evento.participanteIds) && evento.participanteIds.includes(idUsuario)) {
      return true
    }
    return false
  }

  function abrirNuevoEvento(fecha = null, hora = null) {
    setEventoEnEdicion(null)
    setFechaNuevoEvento(fecha)
    setHoraNuevoEvento(hora)
    setPanelDia(null)
    setEventoSeleccionado(null)
    setAlcanceEdicion('serie')
    setModalAbierto(true)
  }

  // En la vista semanal, un clic en un horario libre trae la hora: abre el alta con esa hora
  function seleccionarDia(fecha, hora = null) {
    setDiaSeleccionado(fecha)
    if (hora) {
      abrirNuevoEvento(fecha, hora)
      return
    }
    const delDia = eventosDelDia(eventos, fecha)
    if (delDia.length === 0) abrirNuevoEvento(fecha)
    else { setPanelDia(fecha); setEventoSeleccionado(null) }
  }

  function seleccionarEvento(evento) {
    setDiaSeleccionado(evento.fechaOcurrencia || evento.fecha)
    setPanelDia(evento.fechaOcurrencia || evento.fecha)
    setEventoSeleccionado(evento)
  }

  function cambiarPeriodo(direccion) {
    const siguiente = moverPeriodo(vista, referencia, direccion)
    setReferencia(siguiente)
    setDiaSeleccionado(siguiente)
    setPanelDia(null)
    setEventoSeleccionado(null)
  }

  function volverHoy() {
    const fecha = hoyIso()
    setReferencia(fecha)
    setDiaSeleccionado(fecha)
    setPanelDia(null)
    setEventoSeleccionado(null)
  }

  function solicitarEditarEvento(evento) {
    if (evento?.recurrente) {
      setDialogoAlcance({ accion: 'editar', evento })
      return
    }
    setEventoEnEdicion(evento)
    setAlcanceEdicion('serie')
    setModalAbierto(true)
  }

  function solicitarEliminarEvento(evento) {
    if (evento?.recurrente) {
      setDialogoAlcance({ accion: 'eliminar', evento })
      return
    }
    ejecutarEliminacion(evento, 'serie')
  }

  function cerrarModal() {
    setModalAbierto(false)
    setEventoEnEdicion(null)
    setFechaNuevoEvento(null)
    setAlcanceEdicion('serie')
  }

  async function manejarGuardarEvento(datosFormulario) {
    if (eventoEnEdicion?.id) {
      if (datosFormulario.alcance === 'ocurrencia') {
        const fechaOcurrencia =
          datosFormulario.fechaOcurrencia ||
          eventoEnEdicion.fechaOcurrencia ||
          eventoEnEdicion.fecha
        await editarOcurrenciaEvento(
          proyectoId,
          eventoEnEdicion.id,
          fechaOcurrencia,
          datosFormulario,
        )
      } else {
        await editarEvento(proyectoId, eventoEnEdicion.id, datosFormulario)
      }
      avisar('Evento actualizado correctamente.')
    } else {
      await crearEvento(proyectoId, datosFormulario)
      avisar('Evento creado correctamente.')
    }
    setPanelDia(null)
    setEventoSeleccionado(null)
    reintentar()
  }

  async function ejecutarEliminacion(evento, alcance = 'serie') {
    if (eliminandoId) return
    setEliminandoId(evento.id)
    try {
      if (alcance === 'ocurrencia') {
        const fechaOcurrencia = evento.fechaOcurrencia || evento.fecha
        await cancelarOcurrenciaEvento(proyectoId, evento.id, fechaOcurrencia)
      } else {
        await eliminarEvento(proyectoId, evento.id)
      }
      setDialogoAlcance(null)
      avisar('Evento eliminado correctamente.')
      setPanelDia(null)
      setEventoSeleccionado(null)
      reintentar()
    } catch (err) {
      setDialogoAlcance(null)
      avisarError(
        err?.message || 'No pudimos eliminar el evento. Intentá nuevamente.',
      )
    } finally {
      setEliminandoId(null)
    }
  }

  function manejarEleccionAlcance(alcance) {
    if (!dialogoAlcance?.evento) return
    const { accion, evento } = dialogoAlcance
    if (accion === 'editar') {
      setDialogoAlcance(null)
      setEventoEnEdicion(evento)
      setAlcanceEdicion(alcance)
      setModalAbierto(true)
      return
    }
    ejecutarEliminacion(evento, alcance)
  }

  async function manejarGuardarActa(evento, textoActa) {
    await guardarActaReunion(proyectoId, evento.id, textoActa)
    // El detalle abierto muestra el acta nueva sin esperar a que se recargue el calendario
    setEventoSeleccionado((actual) =>
      actual && actual.id === evento.id ? { ...actual, acta: textoActa } : actual,
    )
    avisar('Acta guardada correctamente.')
    reintentar()
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
      className="mx-auto max-w-6xl px-4 pb-6 text-texto sm:px-8 sm:pb-10"
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
              <section aria-labelledby="titulo-calendario">
                <CabeceraCalendario nombreProyecto={proyecto.nombre} vista={vista} referencia={referencia} periodo={periodo} onAnterior={() => cambiarPeriodo(-1)} onSiguiente={() => cambiarPeriodo(1)} onHoy={volverHoy} onVista={(valor) => { setVista(valor); setPanelDia(null); setEventoSeleccionado(null) }} mostrarNuevo={false} proyectoId={proyectoId} fechaSeleccionada={diaSeleccionado} mostrarIrAlDia={!panelDia} />

                {cargando && <p role="status" className="mb-3 text-sm text-texto-suave">Cargando eventos…</p>}
                <VistaCalendario vista={vista} periodo={periodo} referencia={referencia} eventos={eventos} hoy={hoyIso()} diaSeleccionado={diaSeleccionado} onDia={seleccionarDia} onEvento={seleccionarEvento} />
                {!eventos.length && <p className="mt-4 rounded-md bg-superficie p-4 text-sm text-texto-suave">Todavía no hay eventos en este período. Seleccioná un día para agregar uno.</p>}
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-texto-suave"><span className="flex items-center gap-2"><span className="size-4 rounded-sm border border-agua bg-agua/15" />Evento</span><span className="flex items-center gap-2"><span className="size-4 rounded-sm border border-primario bg-primario/10" />Cambio de rutina</span></div>
              </section>

              <PanelCalendario
                dia={panelDia}
                evento={eventoSeleccionado}
                eventos={panelDia ? eventosDelDia(eventos, panelDia) : []}
                borrador={panelDia ? leerBorrador(proyectoId, claveBorradorNuevo(panelDia)) : null}
                proyectoId={proyectoId}
                miembros={miembros}
                puedeModificar={puedeModificarEvento}
                eliminandoId={eliminandoId}
                onCerrar={() => { setPanelDia(null); setEventoSeleccionado(null) }}
                onVolver={() => setEventoSeleccionado(null)}
                onEvento={seleccionarEvento}
                onNuevo={abrirNuevoEvento}
                onEditar={solicitarEditarEvento}
                onEliminar={solicitarEliminarEvento}
                onDescargarImagen={manejarDescargaImagen}
                puedeEditarActa={puedeEditarActa}
                onGuardarActa={manejarGuardarActa}
                puedeAgregarAcuerdos={proyecto?.puedeCargar !== false}
              />

              <ModalEvento
                abierto={modalAbierto}
                proyectoId={proyectoId}
                evento={eventoEnEdicion}
                fechaPorDefecto={fechaNuevoEvento}
                horaInicioPorDefecto={horaNuevoEvento}
                miembros={miembros}
                alcance={alcanceEdicion}
                onCerrar={cerrarModal}
                onGuardar={manejarGuardarEvento}
                onEliminar={(evento) => {
                  cerrarModal()
                  solicitarEliminarEvento(evento)
                }}
              />

              <ModalAlcanceRecurrente
                abierto={Boolean(dialogoAlcance)}
                accion={dialogoAlcance?.accion}
                evento={dialogoAlcance?.evento}
                procesando={Boolean(eliminandoId)}
                onCerrar={() => setDialogoAlcance(null)}
                onElegir={manejarEleccionAlcance}
              />
            </>
          )
        )}
      </div>
    </main>
  )
}

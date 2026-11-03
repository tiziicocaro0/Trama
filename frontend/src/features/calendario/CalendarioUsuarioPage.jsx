import { useEffect, useMemo, useState } from 'react'
import { listarEventos } from '../../api/eventos.js'
import { crearEvento } from '../../api/eventos.js'
import { listarMisProyectos } from '../../api/proyectos.js'
import Boton from '../../components/ui/Boton.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { hoyIso } from '../../utils/fechas.js'
import CabeceraCalendario from './components/CabeceraCalendario.jsx'
import PanelCalendario from './components/PanelCalendario.jsx'
import VistaCalendario from './components/VistaCalendario.jsx'
import ModalEvento from './components/ModalEvento.jsx'
import { eventosDelDia, moverPeriodo, obtenerPeriodo } from './utils/periodo.js'

export default function CalendarioUsuarioPage() {
  const [vista, setVista] = useState('semana')
  const [referencia, setReferencia] = useState(() => hoyIso())
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [proyectoFiltro, setProyectoFiltro] = useState('')
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => hoyIso())
  const [panelDia, setPanelDia] = useState(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [fechaCreacion, setFechaCreacion] = useState(null)
  const [horaCreacion, setHoraCreacion] = useState(null)
  const [proyectoCreacion, setProyectoCreacion] = useState('')
  const [elegirAcompanamiento, setElegirAcompanamiento] = useState(false)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const periodo = obtenerPeriodo(vista, referencia)

  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      try {
        const proyectos = await listarMisProyectos(controller.signal)
        const listas = await Promise.all(proyectos.map(async (proyecto) =>
          (await listarEventos(proyecto.id, { desde: periodo.desde, hasta: periodo.hasta, signal: controller.signal }))
            .map((evento) => ({ ...evento, proyectoNombre: proyecto.nombre })),
        ))
        if (!controller.signal.aborted) setResultado({ intento, proyectos, eventos: listas.flat() })
      } catch (error) {
        if (!controller.signal.aborted) setResultado({ intento, error: error?.response?.status === 401 ? 'Tu sesión venció. Ingresá nuevamente.' : error?.response?.status === 403 ? 'No tenés permiso para consultar uno de tus acompañamientos.' : 'No pudimos cargar el calendario. Revisá tu conexión e intentá nuevamente.' })
      }
    }
    void cargar()
    return () => controller.abort()
  }, [intento, periodo.desde, periodo.hasta])

  const cargando = resultado?.intento !== intento
  const proyectos = resultado?.proyectos ?? []
  const todosEventos = resultado?.eventos
  const eventos = useMemo(() => {
    const lista = todosEventos ?? []
    return proyectoFiltro ? lista.filter((evento) => evento.proyectoId === proyectoFiltro) : lista
  }, [todosEventos, proyectoFiltro])

  function seleccionarDia(dia, hora = null) {
    setDiaSeleccionado(dia)
    setPanelDia(null)
    setEventoSeleccionado(null)
    setFechaCreacion(dia)
    setHoraCreacion(hora)
    setProyectoCreacion(proyectoFiltro)
    setElegirAcompanamiento(true)
  }

  function continuarCreacion() {
    if (!proyectoCreacion) return
    setElegirAcompanamiento(false)
    setFormularioAbierto(true)
  }

  async function guardarEvento(datos) {
    await crearEvento(proyectoCreacion, datos)
    setFormularioAbierto(false)
    setFechaCreacion(null)
    setHoraCreacion(null)
    setIntento((anterior) => anterior + 1)
  }

  function seleccionarEvento(evento) {
    setDiaSeleccionado(evento.fechaOcurrencia || evento.fecha)
    setPanelDia(evento.fechaOcurrencia || evento.fecha)
    setEventoSeleccionado(evento)
  }

  function cambiarPeriodo(direccion) {
    setReferencia((anterior) => moverPeriodo(vista, anterior, direccion))
    setDiaSeleccionado((anterior) => moverPeriodo(vista, anterior, direccion))
    setPanelDia(null)
    setEventoSeleccionado(null)
  }

  function volverHoy() {
    const hoy = hoyIso()
    setReferencia(hoy)
    setDiaSeleccionado(hoy)
    setPanelDia(null)
    setEventoSeleccionado(null)
  }

  return <section aria-labelledby="titulo-calendario-usuario">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h2 id="titulo-calendario-usuario" className="font-display text-h1 text-secundario">Calendario</h2><p className="mt-1 text-texto-suave">Tus eventos en los acompañamientos a los que pertenecés.</p></div>
      <Boton to="/acompanamientos" variant="secondary">Ver acompañamientos</Boton>
    </div>
    <div className="mb-4 max-w-sm">
      <label htmlFor="filtro-calendario-proyecto" className="mb-1 block text-sm font-semibold">Acompañamiento</label>
      <select id="filtro-calendario-proyecto" value={proyectoFiltro} onChange={(evento) => setProyectoFiltro(evento.target.value)} className="min-h-11 w-full rounded-sm border border-borde bg-superficie px-3"><option value="">Todos mis acompañamientos</option>{proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}</select>
    </div>
    <CabeceraCalendario nombreProyecto="tus acompañamientos" vista={vista} referencia={referencia} periodo={periodo} onAnterior={() => cambiarPeriodo(-1)} onSiguiente={() => cambiarPeriodo(1)} onHoy={volverHoy} onVista={(valor) => { setVista(valor); setPanelDia(null); setEventoSeleccionado(null) }} mostrarNuevo={false} />
    {resultado?.error && <Aviso tipo="error">{resultado.error} <button type="button" onClick={() => setIntento((anterior) => anterior + 1)} className="ml-2 underline">Reintentar</button></Aviso>}
    {cargando && <p role="status" className="mb-3 text-sm text-texto-suave">Cargando tus eventos…</p>}
    {!cargando && !resultado?.error && proyectos.length === 0 && <p className="mb-4 rounded-md bg-superficie p-4 text-texto-suave">Todavía no participás en ningún acompañamiento.</p>}
    <VistaCalendario vista={vista} periodo={periodo} referencia={referencia} eventos={eventos} hoy={hoyIso()} diaSeleccionado={diaSeleccionado} onDia={seleccionarDia} onEvento={seleccionarEvento} />
    {!cargando && !resultado?.error && eventos.length === 0 && <p className="mt-4 rounded-md bg-superficie p-4 text-sm text-texto-suave">No hay eventos en este período.</p>}
    <div className="mt-5 flex flex-wrap gap-4 text-xs text-texto-suave"><span className="flex items-center gap-2"><span className="size-4 rounded-sm border border-agua bg-agua/15" />Evento</span><span className="flex items-center gap-2"><span className="size-4 rounded-sm border border-primario bg-primario/10" />Cambio de rutina</span></div>
    <PanelCalendario dia={panelDia} evento={eventoSeleccionado} eventos={panelDia ? eventosDelDia(eventos, panelDia) : []} proyectoId={eventoSeleccionado?.proyectoId} miembros={[]} puedeModificar={() => false} eliminandoId={null} soloLectura onCerrar={() => { setPanelDia(null); setEventoSeleccionado(null) }} onVolver={() => setEventoSeleccionado(null)} onEvento={seleccionarEvento} />
    <Modal abierto={elegirAcompanamiento} titulo="¿En qué acompañamiento va el evento?" onCerrar={() => setElegirAcompanamiento(false)}>
      <div className="space-y-4">
        <label htmlFor="proyecto-evento-usuario" className="block text-sm font-semibold">Acompañamiento</label>
        <select id="proyecto-evento-usuario" value={proyectoCreacion} onChange={(evento) => setProyectoCreacion(evento.target.value)} className="min-h-11 w-full rounded-sm border border-borde bg-superficie px-3"><option value="">Elegí un acompañamiento</option>{proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}</select>
        <div className="flex justify-end gap-3"><Boton variant="secondary" onClick={() => setElegirAcompanamiento(false)}>Cancelar</Boton><Boton onClick={continuarCreacion} disabled={!proyectoCreacion}>Continuar</Boton></div>
      </div>
    </Modal>
    <ModalEvento abierto={formularioAbierto} proyectoId={proyectoCreacion} fechaPorDefecto={fechaCreacion} horaInicioPorDefecto={horaCreacion} onCerrar={() => setFormularioAbierto(false)} onGuardar={guardarEvento} />
  </section>
}

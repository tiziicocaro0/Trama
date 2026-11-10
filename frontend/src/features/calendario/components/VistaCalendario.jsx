import { ArrowsClockwise, CalendarBlank, Plus } from '@phosphor-icons/react'
import { eventosDelDia, fechaLocal, tituloDia } from '../utils/periodo.js'

const NOMBRES_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function hora(evento) {
  return evento.horaInicio?.slice(0, 5) || ''
}

function EventoBreve({ evento, onSeleccionar, compacto = false }) {
  const cambio = Boolean(evento.esCambio)
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(evento)}
      aria-label={`Ver evento: ${evento.titulo}`}
      className={`w-full min-w-0 rounded-sm border px-2 py-1 text-left text-xs focus-visible:outline-2 focus-visible:outline-primario ${cambio ? 'border-primario bg-primario/10 text-primario' : 'border-agua bg-agua/15 text-secundario'}`}
    >
      <span className="flex min-w-0 items-center gap-1">
        {cambio && <CalendarBlank size={13} aria-hidden="true" />}
        {evento.recurrente && <ArrowsClockwise size={13} aria-hidden="true" />}
        <span className="truncate">{hora(evento)} {evento.proyectoNombre ? `${evento.proyectoNombre}: ` : ''}{evento.titulo}</span>
      </span>
      {cambio && !compacto && <span className="block font-semibold">Cambio de rutina</span>}
    </button>
  )
}

// Sábado y domingo se ven con otro fondo
function esFinDeSemana(dia) {
  const numero = fechaLocal(dia).getDay()
  return numero === 0 || numero === 6
}

function CabeceraDia({ dia, indice, hoy, seleccionado, onSeleccionar }) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(dia)}
      aria-label={`Seleccionar ${tituloDia(dia)}`}
      aria-pressed={seleccionado}
      className={`min-h-16 w-full p-2 text-center text-superficie focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-superficie ${seleccionado ? 'bg-superficie/20' : ''}`}
    >
      <span className="block text-xs font-semibold uppercase tracking-wide">{NOMBRES_DIAS[indice]}</span>
      <span className={`mx-auto mt-1 block w-fit rounded-full px-2 font-semibold ${hoy ? 'bg-superficie text-primario' : ''}`}>{fechaLocal(dia).getDate()}</span>
    </button>
  )
}

function VistaSemanal({ periodo, eventos, hoy, diaSeleccionado, onDia, onEvento }) {
  const horasEventos = eventos.map((evento) => Number(evento.horaInicio?.slice(0, 2))).filter(Number.isFinite)
  const primeraHora = Math.min(8, ...horasEventos)
  const ultimaHora = Math.max(19, ...horasEventos)
  const horas = Array.from({ length: ultimaHora - primeraHora + 1 }, (_, indice) => primeraHora + indice)

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-borde bg-superficie shadow-sm md:block">
        {/* Encabezado de los días en terracota, para que se distinga de la grilla */}
        <div className="flex border-b border-borde bg-primario">
          <div className="w-16 shrink-0" />
          <div className="grid flex-1 grid-cols-7">
            {periodo.dias.map((dia, indice) => <CabeceraDia key={dia} dia={dia} indice={indice} hoy={dia === hoy} seleccionado={dia === diaSeleccionado} onSeleccionar={onDia} />)}
          </div>
        </div>
        <div className="max-h-screen overflow-y-auto">
          {horas.map((numero) => (
            <div key={numero} className="flex border-b border-borde last:border-b-0">
              <div className="w-16 shrink-0 p-2 text-right text-xs text-texto-suave">{String(numero).padStart(2, '0')}:00</div>
              <div className="grid min-h-16 flex-1 grid-cols-7">
                {periodo.dias.map((dia) => {
                  const delHorario = eventosDelDia(eventos, dia).filter((evento) => Number(evento.horaInicio?.slice(0, 2)) === numero)
                  return <div key={dia} className={`min-w-0 border-l border-borde p-1 ${esFinDeSemana(dia) ? 'bg-fondo' : ''}`}>
                    {delHorario.length ? <div className="space-y-1">{delHorario.map((evento) => <EventoBreve key={`${evento.id}-${dia}`} evento={evento} onSeleccionar={onEvento} />)}</div> : <button type="button" onClick={() => onDia(dia, `${String(numero).padStart(2, '0')}:00`)} aria-label={`Agregar evento el ${tituloDia(dia)} a las ${String(numero).padStart(2, '0')}:00`} className="min-h-14 w-full rounded-sm text-transparent hover:bg-fondo hover:text-primario focus-visible:text-primario"><Plus size={16} className="mx-auto" aria-hidden="true" /></button>}
                  </div>
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {periodo.dias.map((dia, indice) => <CabeceraDia key={dia} dia={dia} indice={indice} hoy={dia === hoy} seleccionado={dia === diaSeleccionado} onSeleccionar={onDia} />)}
        </div>
        <AgendaDia dia={diaSeleccionado || hoy} eventos={eventosDelDia(eventos, diaSeleccionado || hoy)} onDia={onDia} onEvento={onEvento} />
      </div>
    </>
  )
}

function AgendaDia({ dia, eventos, onDia, onEvento }) {
  return <div className="mt-5 space-y-3">
    <div><h3 className="font-display text-h2 capitalize text-secundario">{tituloDia(dia)}</h3><p className="text-sm text-texto-suave">{eventos.length} {eventos.length === 1 ? 'actividad' : 'actividades'}</p></div>
    {eventos.length ? eventos.map((evento) => <button key={`${evento.id}-${dia}`} type="button" onClick={() => onEvento(evento)} className={`flex min-h-20 w-full items-center gap-3 rounded-md border p-3 text-left shadow-sm ${evento.esCambio ? 'border-primario bg-primario/10' : 'border-borde bg-superficie'}`}><span className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${evento.esCambio ? 'bg-primario/15 text-primario' : 'bg-agua/20 text-secundario'}`}><CalendarBlank size={22} aria-hidden="true" /></span><span className="min-w-0"><span className="block text-sm text-texto-suave">{hora(evento)}{evento.recurrente ? ' · Semanal' : ''}</span><span className="block truncate font-semibold">{evento.titulo}</span>{evento.proyectoNombre && <span className="block text-xs text-texto-suave">{evento.proyectoNombre}</span>}{evento.esCambio && <span className="text-xs text-primario">Cambio de rutina</span>}</span><span className="ml-auto text-primario" aria-hidden="true">›</span></button>) : <button type="button" onClick={() => onDia(dia)} className="w-full rounded-md border border-dashed border-borde bg-superficie p-5 text-left text-texto-suave">No hay eventos este día.</button>}
  </div>
}

function VistaMensual({ periodo, referencia, eventos, hoy, diaSeleccionado, onDia, onEvento }) {
  const mes = fechaLocal(referencia).getMonth()
  return <div className="overflow-hidden rounded-lg border border-borde bg-superficie shadow-sm">
    {/* Encabezado de los días en terracota, para que se distinga de la grilla */}
    <div className="grid grid-cols-7 bg-primario">{NOMBRES_DIAS.map((nombre) => <span key={nombre} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-superficie">{nombre}</span>)}</div>
    <div className="grid grid-cols-7">
      {periodo.dias.map((dia) => {
        const delDia = eventosDelDia(eventos, dia)
        const fuera = fechaLocal(dia).getMonth() !== mes
        // Los días de otro mes, bien más oscuros; el sábado y el domingo, con otro fondo
        const fondo = fuera ? 'bg-texto/15 text-texto-suave' : esFinDeSemana(dia) ? 'bg-fondo' : ''
        return <div key={dia} className={`min-h-24 min-w-0 border-t border-r border-borde p-1 last:border-r-0 sm:min-h-32 sm:p-2 ${dia === diaSeleccionado ? 'bg-acento/15' : fondo} ${dia === hoy ? 'outline-2 outline-inset outline-primario' : ''}`}>
          <button type="button" onClick={() => onDia(dia)} aria-label={`Seleccionar ${tituloDia(dia)}`} className={`mb-1 block rounded-full px-1.5 text-xs focus-visible:outline-2 focus-visible:outline-primario ${dia === hoy ? 'bg-primario text-superficie' : ''}`}>{fechaLocal(dia).getDate()}</button>
          <div className="space-y-1">{delDia.slice(0, 3).map((evento) => <EventoBreve key={`${evento.id}-${dia}`} evento={evento} onSeleccionar={onEvento} compacto />)}{delDia.length > 3 && <button type="button" onClick={() => onDia(dia)} className="text-xs text-texto-suave">+{delDia.length - 3} más</button>}</div>
          {!delDia.length && <button type="button" onClick={() => onDia(dia)} aria-label={`Agregar evento el ${tituloDia(dia)}`} className="min-h-12 w-full text-left text-transparent hover:text-primario focus-visible:text-primario"><Plus size={15} aria-hidden="true" /></button>}
        </div>
      })}
    </div>
  </div>
}

export default function VistaCalendario({ vista, periodo, referencia, eventos, hoy, diaSeleccionado, onDia, onEvento }) {
  return vista === 'semana'
    ? <VistaSemanal periodo={periodo} eventos={eventos} hoy={hoy} diaSeleccionado={diaSeleccionado} onDia={onDia} onEvento={onEvento} />
    : <VistaMensual periodo={periodo} referencia={referencia} eventos={eventos} hoy={hoy} diaSeleccionado={diaSeleccionado} onDia={onDia} onEvento={onEvento} />
}

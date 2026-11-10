import { CaretLeft, CaretRight, Plus, Sparkle } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import { tituloPeriodo } from '../utils/periodo.js'

export default function CabeceraCalendario({ nombreProyecto, vista, referencia, periodo, onNuevo, onAnterior, onSiguiente, onHoy, onVista, mostrarNuevo = true, proyectoId, fechaSeleccionada, mostrarIrAlDia = true }) {
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id="titulo-calendario" className="font-display text-h1 text-secundario">Calendario</h2>
        <p className="mt-1 text-texto-suave">Organizá y consultá las actividades, encuentros y cambios importantes de {nombreProyecto}.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {mostrarIrAlDia && proyectoId && fechaSeleccionada && <Boton to={`/proyectos/${proyectoId}/hoy?fecha=${fechaSeleccionada}`} variant="secondary" tamano="chico"><Sparkle size={18} aria-hidden="true" />Mostrarle el día</Boton>}
        {mostrarNuevo && <Boton onClick={onNuevo} tamano="chico" className="fixed right-4 bottom-20 z-30 shadow-md md:static md:shadow-none"><Plus size={18} aria-hidden="true" />Nuevo evento</Boton>}
      </div>
    </div>
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="order-2 flex items-center gap-2 md:order-1">
        <button type="button" onClick={onAnterior} aria-label="Período anterior" className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-borde bg-superficie"><CaretLeft size={18} aria-hidden="true" /></button>
        <h3 className="min-w-0 flex-1 text-center font-display text-h2 capitalize text-secundario md:flex-none" aria-live="polite">{tituloPeriodo(vista, referencia, periodo)}</h3>
        <button type="button" onClick={onSiguiente} aria-label="Período siguiente" className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-borde bg-superficie"><CaretRight size={18} aria-hidden="true" /></button>
        <button type="button" onClick={onHoy} className="min-h-11 rounded-sm border border-borde bg-superficie px-3 text-sm">Hoy</button>
      </div>
      <div role="group" aria-label="Vista del calendario" className="order-1 inline-flex rounded-md border border-borde bg-decoracion p-1 md:order-2">
        {[['mes', 'Mensual'], ['semana', 'Semanal']].map(([valor, etiqueta]) => <button key={valor} type="button" onClick={() => onVista(valor)} aria-pressed={vista === valor} className={`min-h-11 flex-1 rounded-sm px-5 text-sm md:flex-none ${vista === valor ? 'bg-superficie text-texto shadow-sm' : 'text-texto-suave'}`}>{etiqueta}</button>)}
      </div>
    </div>
  </>
}

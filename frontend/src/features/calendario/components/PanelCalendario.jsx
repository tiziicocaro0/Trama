import { useEffect, useRef } from 'react'
import { Plus, Sparkle, X } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import { tituloDia } from '../utils/periodo.js'
import TarjetaEvento from './TarjetaEvento.jsx'

export default function PanelCalendario({ dia, evento, eventos, proyectoId, miembros, puedeModificar, eliminandoId, onCerrar, onEvento, onVolver, onNuevo, onEditar, onEliminar, onDescargarImagen, puedeEditarActa, onGuardarActa, soloLectura = false }) {
  const abierto = Boolean(dia || evento)
  const botonCerrar = useRef(null)
  const cerrarActual = useRef(onCerrar)
  useEffect(() => { cerrarActual.current = onCerrar }, [onCerrar])
  useEffect(() => {
    if (!abierto) return undefined
    const origen = document.activeElement
    botonCerrar.current?.focus()
    function alTeclar(eventoTeclado) { if (eventoTeclado.key === 'Escape') cerrarActual.current() }
    document.addEventListener('keydown', alTeclar)
    return () => { document.removeEventListener('keydown', alTeclar); origen?.focus?.() }
  }, [abierto])
  if (!abierto) return null

  const autor = evento && miembros.find((miembro) => miembro.usuarioId === evento.autorId || miembro.id === evento.autorId)
  const autorNombre = autor ? [autor.nombre, autor.apellido].filter(Boolean).join(' ') : null
  return <div className="fixed inset-0 z-40 bg-texto/30" onMouseDown={(accion) => { if (accion.target === accion.currentTarget) onCerrar() }}>
    <aside role="dialog" aria-modal="true" aria-label={evento ? `Detalle de ${evento.titulo}` : `Eventos del ${tituloDia(dia)}`} className="absolute inset-x-0 bottom-0 max-h-screen overflow-y-auto rounded-t-lg bg-superficie p-5 shadow-md md:inset-y-0 md:right-0 md:left-auto md:w-96 md:rounded-none md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        {evento ? <button type="button" onClick={onVolver} className="min-h-11 text-sm text-texto-suave">← Volver</button> : <span />}
        <button ref={botonCerrar} type="button" onClick={onCerrar} aria-label="Cerrar detalle" className="flex size-11 items-center justify-center rounded-sm hover:bg-fondo"><X size={22} aria-hidden="true" /></button>
      </div>
      {evento ? <>{evento.proyectoNombre && <p className="mb-3 text-sm text-texto-suave">Acompañamiento: {evento.proyectoNombre}</p>}<TarjetaEvento proyectoId={proyectoId} evento={evento} autorNombre={autorNombre} miembros={miembros} puedeModificar={puedeModificar(evento)} puedeEditarActa={Boolean(puedeEditarActa?.(evento))} onGuardarActa={onGuardarActa} eliminando={eliminandoId === evento.id} onEditar={onEditar} onEliminar={onEliminar} onDescargarImagen={onDescargarImagen} /></> : <>
        <h3 className="font-display text-h2 capitalize text-secundario">{tituloDia(dia)}</h3>
        <p className="mb-5 text-sm text-texto-suave">{eventos.length} {eventos.length === 1 ? 'actividad' : 'actividades'}</p>
        {eventos.length ? <div className="space-y-2">{eventos.map((item) => <button key={`${item.id}-${item.fechaOcurrencia || item.fecha}`} type="button" onClick={() => onEvento(item)} className={`w-full rounded-md border p-3 text-left ${item.esCambio ? 'border-primario bg-primario/10' : 'border-borde bg-fondo/40'}`}><span className="block text-xs text-texto-suave">{item.horaInicio?.slice(0, 5) || 'Sin horario'}</span><span className="font-semibold">{item.titulo}</span>{item.proyectoNombre && <span className="block text-xs text-texto-suave">{item.proyectoNombre}</span>}{item.esCambio && <span className="block text-xs text-primario">Cambio de rutina</span>}</button>)}</div> : <p className="text-texto-suave">No hay eventos este día.</p>}
        {!soloLectura && <Boton onClick={() => onNuevo(dia)} className="mt-5 w-full"><Plus size={18} aria-hidden="true" /> Agregar evento</Boton>}
      </>}
      {dia && <Boton to={`/proyectos/${proyectoId}/hoy?fecha=${dia}`} variant="secondary" className="mt-4 w-full"><Sparkle size={18} aria-hidden="true" />Mostrarle el día</Boton>}
    </aside>
  </div>
}

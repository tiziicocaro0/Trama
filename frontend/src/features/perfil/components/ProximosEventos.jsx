import { CalendarBlank } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos } from '../../../api/eventos.js'

const DIAS = 7
const DIA_SEMANA = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })

function fechaIso(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function nombreDia(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const semana = DIA_SEMANA.format(new Date(anio, mes - 1, dia)).replace('.', '')
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

// En la portada, todo lo de los próximos 7 días (incluidas las actividades semanales).
// 5.4: los cambios en su rutina se marcan aparte. Si no hay nada, no ocupa lugar.
export default function ProximosEventos({ proyectoId }) {
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    const control = new AbortController()
    const hoy = new Date()
    const hasta = new Date(hoy)
    hasta.setDate(hoy.getDate() + DIAS)
    listarEventos(proyectoId, { signal: control.signal, desde: fechaIso(hoy), hasta: fechaIso(hasta) })
      .then((lista) =>
        setEventos(
          lista
            .map((evento) => ({ ...evento, dia: evento.fechaOcurrencia ?? evento.fecha }))
            .sort((a, b) => `${a.dia}${a.horaInicio}`.localeCompare(`${b.dia}${b.horaInicio}`)),
        ),
      )
      .catch(() => {})
    return () => control.abort()
  }, [proyectoId])

  if (!eventos.length) return null
  const cambios = eventos.filter((evento) => evento.esCambio).length

  return (
    <section
      aria-labelledby="titulo-proximos-eventos"
      className="mb-6 rounded-lg border border-borde bg-superficie p-4 shadow-sm sm:px-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-proximos-eventos" className="flex items-center gap-2 font-semibold text-secundario">
          <CalendarBlank size={22} aria-hidden="true" className="text-primario" />
          Próximos 7 días
          {cambios > 0 && (
            <span className="rounded-full bg-primario/10 px-2.5 py-0.5 text-xs font-semibold text-primario">
              {cambios === 1 ? '1 cambio en su rutina' : `${cambios} cambios en su rutina`}
            </span>
          )}
        </h2>
        <Link
          to={`/proyectos/${proyectoId}/calendario`}
          className="text-sm font-semibold text-primario underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Ver calendario
        </Link>
      </div>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {eventos.map((evento) => (
          <li
            key={`${evento.id}-${evento.dia}`}
            className={`flex min-w-0 items-baseline gap-3 rounded-md px-2 py-1.5 text-sm ${evento.esCambio ? 'bg-primario/10' : ''}`}
          >
            <span className="w-36 shrink-0 whitespace-nowrap font-semibold text-secundario">
              {nombreDia(evento.dia)}
              {evento.horaInicio ? ` · ${String(evento.horaInicio).slice(0, 5)}` : ''}
            </span>
            <span className={`min-w-0 break-words ${evento.esCambio ? 'font-semibold text-primario' : 'text-texto'}`}>
              {evento.titulo}
              {evento.esCambio && <span className="sr-only"> (cambio en su rutina)</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

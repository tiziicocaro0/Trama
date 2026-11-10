import { CalendarBlank } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos } from '../../../api/eventos.js'
import { formatearFechaCalendario } from '../../../utils/fechas.js'

const DIAS = 7

function fechaIso(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

// 5.4: en la portada, los cambios en su rutina de los próximos 7 días.
// Si no hay ninguno (o no se pudieron traer), no ocupa lugar.
export default function ProximosCambios({ proyectoId }) {
  const [cambios, setCambios] = useState([])

  useEffect(() => {
    const control = new AbortController()
    const hoy = new Date()
    const hasta = new Date(hoy)
    hasta.setDate(hoy.getDate() + DIAS)
    listarEventos(proyectoId, { signal: control.signal, desde: fechaIso(hoy), hasta: fechaIso(hasta) })
      .then((eventos) => {
        const proximos = eventos
          .filter((evento) => evento.esCambio)
          .map((evento) => ({ ...evento, dia: evento.fechaOcurrencia ?? evento.fecha }))
          .sort((a, b) => `${a.dia}${a.horaInicio}`.localeCompare(`${b.dia}${b.horaInicio}`))
        setCambios(proximos)
      })
      .catch(() => {})
    return () => control.abort()
  }, [proyectoId])

  if (!cambios.length) return null

  return (
    <section
      aria-labelledby="titulo-proximos-cambios"
      className="mb-6 rounded-lg border border-primario/40 bg-superficie p-4 shadow-sm sm:px-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-proximos-cambios" className="flex items-center gap-2 font-semibold text-primario">
          <CalendarBlank size={22} aria-hidden="true" />
          Cambios en su rutina esta semana
        </h2>
        <Link
          to={`/proyectos/${proyectoId}/calendario`}
          className="text-sm font-semibold text-primario underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          Ver calendario
        </Link>
      </div>
      <ul className="space-y-2">
        {cambios.map((cambio) => (
          <li key={`${cambio.id}-${cambio.dia}`} className="flex flex-wrap items-baseline gap-x-3 text-texto">
            <span className="font-semibold">
              {formatearFechaCalendario(cambio.dia)}
              {cambio.horaInicio ? ` · ${String(cambio.horaInicio).slice(0, 5)}` : ''}
            </span>
            <span>{cambio.titulo}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

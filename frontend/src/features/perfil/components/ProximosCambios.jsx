import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEventos } from '../../../api/eventos.js'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaCalendario, hoyIso } from '../../../utils/fechas.js'
import { esFechaIsoValida, sumarDias } from '../../calendario/utils/periodo.js'

export default function ProximosCambios({ proyectoId }) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const desde = hoyIso()
    // Siete días calendario, incluido hoy, en la zona local del navegador.
    const hasta = sumarDias(desde, 6)
    listarEventos(proyectoId, { desde, hasta, signal: controller.signal }).then(
      (eventos) => {
        const vistos = new Set()
        const cambios = eventos.filter((evento) => {
          const fecha = evento.fechaOcurrencia || evento.fecha
          if (evento.esCambio !== true || !evento.id || !esFechaIsoValida(fecha) || fecha < desde || fecha > hasta) return false
          const clave = `${evento.id}-${fecha}`
          if (vistos.has(clave)) return false
          vistos.add(clave)
          return true
        }).sort((a, b) => {
          const fechaA = a.fechaOcurrencia || a.fecha
          const fechaB = b.fechaOcurrencia || b.fecha
          return `${fechaA} ${a.horaInicio || '99:99'}`.localeCompare(`${fechaB} ${b.horaInicio || '99:99'}`)
        })
        if (!controller.signal.aborted) setResultado({ proyectoId, intento, cambios })
      },
      () => {
        if (!controller.signal.aborted) setResultado({ proyectoId, intento, error: true })
      },
    )
    return () => controller.abort()
  }, [proyectoId, intento])

  const vigente = resultado?.proyectoId === proyectoId && resultado?.intento === intento
  return (
    <section aria-labelledby="proximos-cambios-titulo" className="mb-6 rounded-lg border border-borde bg-superficie p-5 shadow-sm sm:p-6">
      <h2 id="proximos-cambios-titulo" className="font-display text-h2 text-secundario">Próximos cambios</h2>
      {!vigente ? (
        <p role="status" className="mt-3 text-texto-suave">Cargando próximos cambios…</p>
      ) : resultado.error ? (
        <div className="mt-3 space-y-3">
          <p role="alert" className="text-error">No pudimos cargar los próximos cambios.</p>
          <Boton variant="secondary" onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Boton>
        </div>
      ) : resultado.cambios.length === 0 ? (
        <p className="mt-3 text-texto-suave">No hay cambios en los próximos 7 días.</p>
      ) : (
        <ul className="mt-3 divide-y divide-borde/40">
          {resultado.cambios.map((evento) => {
            const fecha = evento.fechaOcurrencia || evento.fecha
            return (
              <li key={`${evento.id}-${fecha}`}>
                <Link to={`/proyectos/${proyectoId}/calendario?fecha=${fecha}`} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-sm py-3 focus-visible:outline-2 focus-visible:outline-primario">
                  <span className="font-semibold text-primario">{evento.titulo}</span>
                  <span className="text-sm text-texto-suave">
                    <time dateTime={fecha}>{formatearFechaCalendario(fecha)}</time>
                    {evento.horaInicio && ` · ${evento.horaInicio.slice(0, 5)}`}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

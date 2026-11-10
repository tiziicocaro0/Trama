import { CalendarBlank, GraduationCap, House, Student } from '@phosphor-icons/react'
import { nombreTipoEscuela } from '../datosEscolares.js'
import { formatearFechaCalendario } from '../../../utils/fechas.js'

// Los datos básicos del niño, en la cabecera del perfil junto a su nombre:
// cada uno con su ícono, el título arriba y el dato abajo.
export default function DatosRapidosNino({ proyecto }) {
  const tipoEscuela = nombreTipoEscuela(proyecto.tipoEscuela)
  const datos = [
    proyecto.apodo && [Student, 'Le dicen', proyecto.apodo],
    proyecto.fechaNacimiento && [CalendarBlank, 'Nació el', formatearFechaCalendario(proyecto.fechaNacimiento)],
    proyecto.escuela && [House, 'Escuela', proyecto.escuela, tipoEscuela],
    proyecto.grado && [GraduationCap, 'Grado', proyecto.grado],
  ].filter(Boolean)

  if (!datos.length) return null
  return (
    <dl aria-label={`Datos de ${proyecto.nombre}`} className="flex flex-wrap gap-x-6 gap-y-3">
      {datos.map(([Icono, etiqueta, valor, aclaracion]) => (
        <div key={etiqueta} className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-decoracion text-secundario">
            <Icono size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
            <dd className="max-w-48 truncate text-sm font-semibold text-texto" title={aclaracion ? `${valor} · ${aclaracion}` : valor}>
              {valor}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

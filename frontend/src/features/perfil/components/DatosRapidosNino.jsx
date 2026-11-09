import { CalendarBlank, GraduationCap, House, Student } from '@phosphor-icons/react'
import { nombreTipoEscuela } from '../datosEscolares.js'
import { calcularEdad } from '../perfil.js'
import { formatearFechaCalendario } from '../../../utils/fechas.js'

// Los datos personales básicos, para tener contexto antes de leer el resto del perfil
export default function DatosRapidosNino({ proyecto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  // dd/mm/aaaa: entra bien en la franja
  const nacimiento = formatearFechaCalendario(proyecto.fechaNacimiento)
  const tipoEscuela = nombreTipoEscuela(proyecto.tipoEscuela)
  const datos = [
    proyecto.apodo && [Student, 'Le dicen', proyecto.apodo],
    nacimiento && [CalendarBlank, 'Nació el', edad === null ? nacimiento : `${nacimiento} (${edad} ${edad === 1 ? 'año' : 'años'})`],
    proyecto.escuela && [House, 'Escuela', tipoEscuela ? `${proyecto.escuela} · ${tipoEscuela}` : proyecto.escuela],
    proyecto.grado && [GraduationCap, 'Grado', proyecto.grado],
  ].filter(Boolean)

  if (!datos.length) return null
  return (
    <section aria-label={`Datos de ${proyecto.nombre}`} className="mb-6 rounded-lg bg-superficie p-4 shadow-sm sm:p-5">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {datos.map(([Icono, etiqueta, valor]) => (
          <div key={etiqueta} className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-decoracion text-secundario">
              <Icono size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
              <dd className="break-words text-texto">{valor}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

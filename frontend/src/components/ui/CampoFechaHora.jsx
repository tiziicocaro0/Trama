import { Clock } from '@phosphor-icons/react'
import Campo from './Campo.jsx'
import CampoFecha from './CampoFecha.jsx'

// Fecha y hora juntas con el calendario de TRAMA en lugar del selector del navegador.
// value y onChange usan el formato de datetime-local ("2026-10-24T11:45"), así los
// formularios que ya lo usaban no cambian su lógica.
export default function CampoFechaHora({ id, value = '', onChange, disabled, required, max }) {
  const fecha = value.slice(0, 10)
  const hora = value.slice(11, 16)

  function cambiar(nuevaFecha, nuevaHora) {
    onChange(nuevaFecha && nuevaHora ? `${nuevaFecha}T${nuevaHora}` : nuevaFecha ? `${nuevaFecha}T` : '')
  }

  return (
    <fieldset>
      <legend className="mb-2 font-semibold">Fecha y hora</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-fecha`} className="sr-only">Fecha</label>
          <CampoFecha
            id={`${id}-fecha`}
            name="fecha"
            value={fecha}
            max={max}
            onChange={(evento) => cambiar(evento.target.value, hora)}
            disabled={disabled}
            required={required}
          />
        </div>
        <div>
          <label htmlFor={`${id}-hora`} className="sr-only">Hora</label>
          <Campo
            id={`${id}-hora`}
            type="time"
            name="hora"
            icon={Clock}
            value={hora}
            onChange={(evento) => cambiar(fecha, evento.target.value)}
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
    </fieldset>
  )
}

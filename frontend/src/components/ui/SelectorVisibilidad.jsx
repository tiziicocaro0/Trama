export default function SelectorVisibilidad({ id, value, onChange, disabled, sensorial = false }) {
  if (sensorial) return (
    <fieldset>
      <legend className="mb-2 font-semibold">¿Quién puede ver este aporte?</legend>
      <div className="space-y-2">
        {[
          ['TODOS', 'Toda la red', 'Visible para todas las personas autorizadas que acompañan al niño.'],
          ['PROFESIONALES', 'Solo equipo profesional', 'Visible para profesionales autorizados y tutores.'],
          ['SOLO_TUTORES', 'Solo tutores', 'Visible únicamente para los tutores autorizados.'],
        ].map(([valor, etiqueta, descripcion]) => <label key={valor} className="flex min-h-14 items-center gap-3 rounded-md border border-borde bg-superficie p-3 has-checked:border-primario"><input type="radio" name="visibilidad" value={valor} checked={value === valor} onChange={onChange} disabled={disabled} /><span><span className="block font-semibold">{etiqueta}</span><span className="text-sm text-texto-suave">{descripcion}</span></span></label>)}
      </div>
    </fieldset>
  )
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        ¿Quién puede verlo?
      </label>
      <select
        id={id}
        name="visibilidad"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-14 w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        <option value="TODOS">Toda la red</option>
        <option value="SOLO_TUTORES">Solo tutores</option>
        <option value="SOLO_SALUD">Salud y tutores</option>
        <option value="SOLO_EDUCACION">Educación y tutores</option>
        <option value="PROFESIONALES">Equipo profesional y tutores</option>
      </select>
    </div>
  )
}

import RadioOvillo from './RadioOvillo.jsx'

export default function SelectorVisibilidad({
  id,
  value,
  onChange,
  disabled,
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">
        ¿Quién puede ver este aporte?
      </legend>

      <div className="space-y-2">
        <RadioOvillo
          name={id}
          value="TODOS"
          checked={value === 'TODOS'}
          onChange={onChange}
          disabled={disabled}
          descripcion="Visible para todas las personas autorizadas que acompañan al niño."
        >
          Toda la red
        </RadioOvillo>

        <RadioOvillo
          name={id}
          value="SOLO_TUTORES"
          checked={value === 'SOLO_TUTORES'}
          onChange={onChange}
          disabled={disabled}
          descripcion="Visible únicamente para los tutores autorizados."
        >
          Solo tutores
        </RadioOvillo>

        <RadioOvillo
          name={id}
          value="SOLO_SALUD"
          checked={value === 'SOLO_SALUD'}
          onChange={onChange}
          disabled={disabled}
          descripcion="Visible para profesionales de salud y tutores autorizados."
        >
          Salud y tutores
        </RadioOvillo>

        <RadioOvillo
          name={id}
          value="SOLO_EDUCACION"
          checked={value === 'SOLO_EDUCACION'}
          onChange={onChange}
          disabled={disabled}
          descripcion="Visible para profesionales de educación y tutores autorizados."
        >
          Educación y tutores
        </RadioOvillo>

        <RadioOvillo
          name={id}
          value="PROFESIONALES"
          checked={value === 'PROFESIONALES'}
          onChange={onChange}
          disabled={disabled}
          descripcion="Visible para profesionales autorizados y tutores."
        >
          Equipo profesional y tutores
        </RadioOvillo>
      </div>
    </fieldset>
  )
}
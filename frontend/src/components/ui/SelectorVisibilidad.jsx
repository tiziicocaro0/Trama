import RadioOvillo from './RadioOvillo.jsx'

const OPCIONES_VISIBILIDAD = [
  [
    'TODOS',
    'Toda la red',
    'Visible para todas las personas autorizadas que acompañan al niño.',
  ],
  [
    'SOLO_TUTORES',
    'Solo tutores',
    'Visible únicamente para los tutores autorizados.',
  ],
  [
    'SOLO_SALUD',
    'Salud y tutores',
    'Visible para profesionales de salud y tutores autorizados.',
  ],
  [
    'SOLO_EDUCACION',
    'Educación y tutores',
    'Visible para profesionales de educación y tutores autorizados.',
  ],
  [
    'PROFESIONALES',
    'Equipo profesional y tutores',
    'Visible para profesionales autorizados y tutores.',
  ],
]

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
        {OPCIONES_VISIBILIDAD.map(
          ([valor, etiqueta, descripcion]) => (
            <RadioOvillo
              key={valor}
              name={id}
              value={valor}
              checked={value === valor}
              onChange={onChange}
              disabled={disabled}
              descripcion={descripcion}
            >
              {etiqueta}
            </RadioOvillo>
          ),
        )}
      </div>
    </fieldset>
  )
}
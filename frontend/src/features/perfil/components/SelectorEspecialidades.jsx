import {
  ESPECIALIDADES_EDUCACION,
  ESPECIALIDADES_SALUD,
} from '../especialidades.js'

const GRUPOS = {
  EDUCACION: { titulo: 'Educación', opciones: ESPECIALIDADES_EDUCACION },
  SALUD: { titulo: 'Salud', opciones: ESPECIALIDADES_SALUD },
}

// 9.4: casillas de especialidades. En el registro se muestran las dos áreas;
// al aceptar una invitación, solo la del rol que eligió quien invita.
export default function SelectorEspecialidades({
  id,
  roles = ['EDUCACION', 'SALUD'],
  seleccionadas,
  onAlternar,
  disabled = false,
  error,
}) {
  return (
    <div className="space-y-5">
      {roles.map((rol) => (
        <fieldset
          key={rol}
          aria-describedby={error ? `${id}-error` : undefined}
          className="space-y-2"
        >
          <legend className="mb-2 font-bold text-texto">
            {GRUPOS[rol].titulo}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {GRUPOS[rol].opciones.map(({ valor, etiqueta }) => (
              <label
                key={valor}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 focus-within:outline-2 focus-within:outline-primario"
              >
                <input
                  type="checkbox"
                  checked={seleccionadas.includes(valor)}
                  onChange={() => onAlternar(valor)}
                  disabled={disabled}
                  className="size-5 shrink-0 accent-primario"
                />
                <span>{etiqueta}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && (
        <p id={`${id}-error`} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}

import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import {
  ESPECIALIDADES_EDUCACION,
  ESPECIALIDADES_SALUD,
  esOtraEspecialidad,
} from '../especialidades.js'

// 9.4: lista de especialidades de un área, una debajo de la otra.
// value: [{ especialidad, aclaracion }]. «Otra» pide escribir qué hace la persona.
export default function SelectorEspecialidades({
  id,
  rol,
  value,
  onChange,
  disabled = false,
  error,
}) {
  const opciones = rol === 'EDUCACION' ? ESPECIALIDADES_EDUCACION : ESPECIALIDADES_SALUD
  const elegida = (valor) => value.find((item) => item.especialidad === valor)

  function alternar(valor) {
    onChange(
      elegida(valor)
        ? value.filter((item) => item.especialidad !== valor)
        : [...value, { especialidad: valor, aclaracion: '' }],
    )
  }

  function aclarar(valor, aclaracion) {
    onChange(
      value.map((item) =>
        item.especialidad === valor ? { ...item, aclaracion } : item,
      ),
    )
  }

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="sr-only">
        Especialidades de {rol === 'EDUCACION' ? 'educación' : 'salud'}
      </legend>
      <ul className="divide-y divide-borde/60 rounded-md border border-borde bg-superficie">
        {opciones.map(({ valor, etiqueta }) => {
          const item = elegida(valor)
          return (
            <li key={valor} className="px-2 py-1">
              <CasillaOvillo
                checked={Boolean(item)}
                onChange={() => alternar(valor)}
                disabled={disabled}
              >
                {etiqueta}
              </CasillaOvillo>
              {item && esOtraEspecialidad(valor) && (
                <div className="pb-3 pl-12 pr-2">
                  <label htmlFor={`${id}-${valor}`} className="mb-1 block text-sm text-texto-suave">
                    Contanos qué hacés
                  </label>
                  <input
                    id={`${id}-${valor}`}
                    type="text"
                    value={item.aclaracion}
                    onChange={(evento) => aclarar(valor, evento.target.value)}
                    maxLength={120}
                    disabled={disabled}
                    placeholder="Por ejemplo: musicoterapeuta"
                    className="min-h-11 w-full rounded-md border border-borde bg-superficie px-3 text-base text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

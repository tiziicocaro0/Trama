import {
  CATEGORIAS_DESREGULACION,
  ICONOS_DESREGULACION,
  TONOS_DESREGULACION,
} from '../camposAporte.js'

const DESCRIPCIONES = {
  SENALES: 'Algo que suele indicar que está empezando a desregularse.',
  AYUDA: 'Algo que suele ayudarlo a sentirse más cómodo o regularse.',
  EVITAR: 'Algo que puede aumentar su malestar o no suele ayudar.',
}

export default function CamposDesregulacion({
  extra,
  setExtra,
  errores,
  disabled,
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold text-texto">
        ¿Qué querés compartir?
      </legend>

      <div className="space-y-3">
        {CATEGORIAS_DESREGULACION.map(([valor, etiqueta]) => {
          const Icono = ICONOS_DESREGULACION[valor]
          const seleccionado = extra.lista === valor

          return (
            <label
              key={valor}
              className={`flex cursor-pointer items-center gap-4 rounded-md border p-4 transition ${
                seleccionado
                  ? 'border-primario'
                  : 'border-borde bg-superficie'
              }`}
            >
              <input
                type="radio"
                name="listaDesregulacion"
                value={valor}
                checked={seleccionado}
                onChange={() =>
                  setExtra((actual) => ({
                    ...actual,
                    lista: valor,
                  }))
                }
                disabled={disabled}
                className="sr-only"
              />

              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${TONOS_DESREGULACION[valor]}`}
              >
                {Icono && <Icono size={20} aria-hidden="true" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-texto">
                  {etiqueta}
                </p>

                <p className="text-sm text-texto-suave">
                  {DESCRIPCIONES[valor]}
                </p>
              </div>

              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  seleccionado ? 'border-primario' : 'border-borde'
                }`}
              >
                {seleccionado && (
                  <span className="size-3 rounded-full bg-primario" />
                )}
              </span>
            </label>
          )
        })}
      </div>

      <p className="mt-3 text-sm text-texto-suave">
        Elegí una sola opción.
      </p>

      {errores.lista && (
        <p role="alert" className="mt-1 text-sm text-error">
          {errores.lista}
        </p>
      )}
    </fieldset>
  )
}
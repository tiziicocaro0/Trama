import SelectorEspecialidades from '../../../perfil/components/SelectorEspecialidades.jsx'
import { TIPOS_CUENTA } from '../tipoCuenta.js'

// 9.4: segundo paso del registro. Familia o profesional y, si es profesional, qué hace.
export default function RegistroTipoCuenta({ registro }) {
  const { valores, errores, enviando, cambiar, alternarEspecialidad } = registro

  return (
    <div className="space-y-6">
      <fieldset
        aria-describedby={errores.tipoCuenta ? 'registro-tipo-error' : undefined}
        className="space-y-3"
      >
        <legend className="mb-3 text-lg text-texto">
          ¿Cómo vas a usar TRAMA?
        </legend>
        {TIPOS_CUENTA.map(({ valor, titulo, descripcion }) => (
          <label
            key={valor}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-4 focus-within:outline-2 focus-within:outline-primario ${valores.tipoCuenta === valor ? 'border-primario' : 'border-borde'}`}
          >
            <input
              type="radio"
              name="tipoCuenta"
              value={valor}
              checked={valores.tipoCuenta === valor}
              onChange={cambiar}
              disabled={enviando}
              aria-invalid={Boolean(errores.tipoCuenta)}
              className="mt-1 size-5 shrink-0 accent-primario"
            />
            <span>
              <span className="block font-bold text-texto">{titulo}</span>
              <span className="block text-texto-suave">{descripcion}</span>
            </span>
          </label>
        ))}
        {errores.tipoCuenta && (
          <p id="registro-tipo-error" className="text-sm text-error">
            {errores.tipoCuenta}
          </p>
        )}
      </fieldset>
      {valores.tipoCuenta === 'PROFESIONAL' && (
        <section aria-labelledby="registro-especialidades" className="space-y-3">
          <h3
            id="registro-especialidades"
            className="text-lg text-texto"
          >
            ¿Qué hacés?
          </h3>
          <p className="text-texto-suave">
            Las vamos a precargar cuando te sumes a cada niño. Ahí podés
            ajustarlas.
          </p>
          <SelectorEspecialidades
            id="registro-especialidades-lista"
            seleccionadas={valores.especialidades}
            onAlternar={alternarEspecialidad}
            disabled={enviando}
            error={errores.especialidades}
          />
        </section>
      )}
    </div>
  )
}

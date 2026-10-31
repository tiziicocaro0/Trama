import SelectorEspecialidades from '../../../perfil/components/SelectorEspecialidades.jsx'
import { AREAS_PROFESIONALES, TIPOS_CUENTA } from '../tipoCuenta.js'

function Opciones({ nombre, legend, opciones, valor, onElegir, error, enviando }) {
  const idError = `registro-${nombre}-error`
  return (
    <fieldset aria-describedby={error ? idError : undefined} className="space-y-3">
      <legend className="mb-3 text-lg text-texto">{legend}</legend>
      {opciones.map((opcion) => (
        <label
          key={opcion.valor}
          className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border bg-superficie p-4 has-focus-visible:outline-2 has-focus-visible:outline-primario ${valor === opcion.valor ? 'border-primario' : 'border-borde'}`}
        >
          <input
            type="radio"
            name={nombre}
            value={opcion.valor}
            checked={valor === opcion.valor}
            onChange={() => onElegir(opcion.valor)}
            disabled={enviando}
            aria-invalid={Boolean(error)}
            className="mt-1 size-5 shrink-0 accent-primario"
          />
          <span>
            <span className="block font-bold text-texto">{opcion.titulo}</span>
            <span className="block text-texto-suave">{opcion.descripcion}</span>
          </span>
        </label>
      ))}
      {error && (
        <p id={idError} className="text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

// 9.4: segundo paso del registro. Familia o profesional; el profesional elige
// primero su área (educación o salud) y después qué hace.
export default function RegistroTipoCuenta({ registro }) {
  const { valores, errores, enviando, elegir, cambiarEspecialidades } = registro

  return (
    <div className="space-y-6">
      <Opciones
        nombre="tipoCuenta"
        legend="¿Cómo vas a usar TRAMA?"
        opciones={TIPOS_CUENTA}
        valor={valores.tipoCuenta}
        onElegir={(valor) => elegir('tipoCuenta', valor)}
        error={errores.tipoCuenta}
        enviando={enviando}
      />
      {valores.tipoCuenta === 'PROFESIONAL' && (
        <Opciones
          nombre="area"
          legend="¿En qué área trabajás?"
          opciones={AREAS_PROFESIONALES}
          valor={valores.area}
          onElegir={(valor) => elegir('area', valor)}
          error={errores.area}
          enviando={enviando}
        />
      )}
      {valores.tipoCuenta === 'PROFESIONAL' && valores.area && (
        <section aria-labelledby="registro-especialidades" className="space-y-3">
          <h3 id="registro-especialidades" className="text-lg text-texto">
            ¿Qué hacés?
          </h3>
          <p className="text-texto-suave">
            Las vamos a precargar cuando te sumes a cada niño. Ahí podés ajustarlas.
          </p>
          <SelectorEspecialidades
            id="registro-especialidades-lista"
            rol={valores.area}
            value={valores.especialidades}
            onChange={cambiarEspecialidades}
            disabled={enviando}
            error={errores.especialidades}
          />
        </section>
      )}
    </div>
  )
}

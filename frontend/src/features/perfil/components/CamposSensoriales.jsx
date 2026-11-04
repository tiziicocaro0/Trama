import { CATEGORIAS_SENSORIALES, CONTEXTOS_SENSORIALES, ICONOS_SENSORIALES, TONOS_SENSORIALES } from '../camposAporte.js'

export default function CamposSensoriales({ parte, extra, setExtra, errores, disabled }) {
  if (parte === 'contexto') return (
    <fieldset>
      <legend className="mb-2 font-semibold">¿Dónde ocurrió? <span className="font-normal text-texto-suave">Opcional</span></legend>
      <div className="flex flex-wrap gap-2">
        {CONTEXTOS_SENSORIALES.map(([valor, etiqueta]) => <label key={valor} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borde bg-superficie px-3 has-checked:border-primario has-checked:bg-fondo"><input type="radio" name="contextoSensorial" checked={extra.contexto === valor} onChange={() => setExtra((actual) => ({ ...actual, contexto: actual.contexto === valor ? '' : valor }))} disabled={disabled} />{etiqueta}</label>)}
      </div>
    </fieldset>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-suave">Compartí una observación concreta, con palabras cotidianas y sin diagnósticos. La descripción y el archivo son opcionales.</p>
      <fieldset>
        <legend className="mb-2 font-semibold">¿Cómo le resulta?</legend>
        <div className="flex flex-wrap gap-2">
          {[['AYUDA', 'Le ayuda'], ['CUESTA', 'Le cuesta']].map(([valor, etiqueta]) => <label key={valor} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borde bg-superficie px-4 has-checked:border-primario has-checked:bg-fondo"><input type="radio" name="listaSensorial" checked={extra.lista === valor} onChange={() => setExtra((actual) => ({ ...actual, lista: valor }))} disabled={disabled} />{etiqueta}</label>)}
        </div>
        {errores.lista && <p role="alert" className="text-sm text-error">{errores.lista}</p>}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">¿Sobre qué aspecto querés aportar?</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_SENSORIALES.map(([valor, etiqueta]) => { const Icono = ICONOS_SENSORIALES[valor]; return <label key={valor} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-borde px-3 has-checked:border-primario has-checked:bg-fondo ${TONOS_SENSORIALES[valor]}`}><input type="radio" name="categoriaSensorial" checked={extra.categoria === valor} onChange={() => setExtra((actual) => ({ ...actual, categoria: valor }))} disabled={disabled} /><Icono size={20} aria-hidden="true" />{etiqueta}</label> })}
        </div>
        {errores.categoria && <p role="alert" className="text-sm text-error">{errores.categoria}</p>}
      </fieldset>
    </div>
  )
}

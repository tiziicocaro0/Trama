import CampoDetalleOtro from './CampoDetalleOtro.jsx'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import { CATEGORIAS_SENSORIALES, CONTEXTOS_SENSORIALES, ICONOS_SENSORIALES, TONOS_SENSORIALES } from '../camposAporte.js'

export default function CamposSensoriales({ parte, extra, setExtra, errores, disabled }) {
  if (parte === 'contexto') return (
    <fieldset>
      <legend className="mb-2 font-semibold">¿Dónde ocurrió? <span className="font-normal text-texto-suave">Opcional</span></legend>
      <div className="flex flex-wrap gap-2">
        {CONTEXTOS_SENSORIALES.map(([valor, etiqueta]) => <CasillaOvillo key={valor} tipo="radio" tamano="chico" name="contextoSensorial" className="min-h-11 rounded-full border border-borde bg-superficie px-3 has-checked:border-primario has-checked:bg-fondo" checked={extra.contexto === valor} onChange={() => setExtra((actual) => ({ ...actual, contexto: actual.contexto === valor ? '' : valor }))} disabled={disabled}>{etiqueta}</CasillaOvillo>)}
      </div>
      {extra.contexto === 'OTRO' && <CampoDetalleOtro id="contexto-otro-sensorial" valor={extra.contextoOtro} onCambiar={(texto) => setExtra((actual) => ({ ...actual, contextoOtro: texto }))} disabled={disabled} error={errores?.contextoOtro} />}
    </fieldset>
  )

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 font-semibold">¿Cómo le resulta?</legend>
        <div className="flex flex-wrap gap-2">
          {[['AYUDA', 'Le ayuda'], ['CUESTA', 'Le cuesta']].map(([valor, etiqueta]) => <CasillaOvillo key={valor} tipo="radio" tamano="chico" name="listaSensorial" className="min-h-11 rounded-full border border-borde bg-superficie px-4 has-checked:border-primario has-checked:bg-fondo" checked={extra.lista === valor} onChange={() => setExtra((actual) => ({ ...actual, lista: valor }))} disabled={disabled}>{etiqueta}</CasillaOvillo>)}
        </div>
        {errores.lista && <p role="alert" className="text-sm text-error">{errores.lista}</p>}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">¿Sobre qué aspecto querés aportar?</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_SENSORIALES.map(([valor, etiqueta]) => { const Icono = ICONOS_SENSORIALES[valor]; return <CasillaOvillo key={valor} tipo="radio" tamano="chico" name="categoriaSensorial" className={`min-h-11 rounded-full border border-borde px-3 has-checked:border-primario has-checked:bg-fondo ${TONOS_SENSORIALES[valor]}`} checked={extra.categoria === valor} onChange={() => setExtra((actual) => ({ ...actual, categoria: valor }))} disabled={disabled}><span className="inline-flex items-center gap-2"><Icono size={20} aria-hidden="true" />{etiqueta}</span></CasillaOvillo> })}
        </div>
        {errores.categoria && <p role="alert" className="text-sm text-error">{errores.categoria}</p>}
      </fieldset>
    </div>
  )
}

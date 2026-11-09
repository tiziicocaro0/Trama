import { CATEGORIAS_ESTRATEGIA, CONTEXTOS_ESTRATEGIA, ICONOS_ESTRATEGIA, RESULTADOS_ESTRATEGIA, TONOS_ESTRATEGIA } from '../camposAporte.js'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import CampoDetalleOtro from './CampoDetalleOtro.jsx'

export default function CamposEstrategia({ parte, extra, setExtra, errores, disabled }) {
  if (parte === 'categoria') return (
    <fieldset>
      <legend className="mb-2 font-semibold">¿Qué tipo de estrategia querés compartir?</legend>
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS_ESTRATEGIA.map(([valor, etiqueta]) => { const Icono = ICONOS_ESTRATEGIA[valor]; return <label key={valor} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-borde px-3 has-checked:border-primario ${TONOS_ESTRATEGIA[valor]}`}><input type="radio" name="categoriaEstrategia" checked={extra.categoria === valor} onChange={() => setExtra((actual) => ({ ...actual, categoria: valor }))} disabled={disabled} /><Icono size={20} aria-hidden="true" />{etiqueta}</label> })}
      </div>
      {errores.categoria && <p role="alert" className="mt-1 text-sm text-error">{errores.categoria}</p>}
    </fieldset>
  )

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="situacion-estrategia" className="mb-2 block font-semibold">En qué situación</label>
        <textarea id="situacion-estrategia" value={extra.situacion ?? ''} onChange={(event) => setExtra((actual) => ({ ...actual, situacion: event.target.value }))} maxLength={2000} rows={3} disabled={disabled} aria-invalid={Boolean(errores.situacion)} className="w-full rounded-md border border-borde bg-superficie p-4 text-texto focus-visible:outline-2 focus-visible:outline-primario" />
        {errores.situacion && <p role="alert" className="mt-1 text-sm text-error">{errores.situacion}</p>}
      </div>
      <fieldset>
        <legend className="mb-2 font-semibold">Resultado</legend>
        <div className="flex flex-wrap gap-2">
          {RESULTADOS_ESTRATEGIA.map(([valor, etiqueta]) => <label key={valor} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borde bg-superficie px-3 has-checked:border-primario has-checked:bg-fondo"><input type="radio" name="resultadoEstrategia" checked={extra.resultado === valor} onChange={() => setExtra((actual) => ({ ...actual, resultado: valor }))} disabled={disabled} />{etiqueta}</label>)}
        </div>
        {errores.resultado && <p role="alert" className="mt-1 text-sm text-error">{errores.resultado}</p>}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">¿Dónde suele funcionar? <span className="font-normal text-texto-suave">Opcional</span></legend>
        <div className="flex flex-wrap gap-2">
          {CONTEXTOS_ESTRATEGIA.map(([valor, etiqueta]) => <CasillaOvillo key={valor} tamano="chico" className="min-h-11 rounded-full border border-borde bg-superficie px-3 has-checked:border-primario has-checked:bg-fondo" checked={extra.contextos?.includes(valor) ?? false} onChange={(event) => setExtra((actual) => ({ ...actual, contextos: event.target.checked ? [...(actual.contextos ?? []), valor] : (actual.contextos ?? []).filter((item) => item !== valor) }))} disabled={disabled}>{etiqueta}</CasillaOvillo>)}
        </div>
        {extra.contextos?.includes('OTRO') && <CampoDetalleOtro id="contexto-otro-estrategia" valor={extra.contextoOtro} onCambiar={(texto) => setExtra((actual) => ({ ...actual, contextoOtro: texto }))} disabled={disabled} error={errores?.contextoOtro} />}
      </fieldset>
    </div>
  )
}

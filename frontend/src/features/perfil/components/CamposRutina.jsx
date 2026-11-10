import { Check, SquaresFour } from '@phosphor-icons/react'
import { CATEGORIAS_RUTINA, CATEGORIA_RUTINA_PERSONALIZADA, CONTEXTOS_RUTINA, ICONOS_RUTINA, TONOS_RUTINA } from '../camposAporte.js'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import CampoDetalleOtro from './CampoDetalleOtro.jsx'

export default function CamposRutina({ parte, extra, setExtra, errores, disabled }) {
  if (parte === 'categoria') return (
    <fieldset>
      <legend className="mb-2 font-semibold">¿Sobre qué actividad querés aportar?</legend>
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS_RUTINA.map(([valor, etiqueta]) => {
          const Icono = ICONOS_RUTINA[valor]
          const seleccionada = extra.categoria === valor
          return <button key={valor} type="button" aria-pressed={seleccionada} onClick={() => setExtra((actual) => ({ ...actual, categoria: valor, categoriaNombre: '' }))} disabled={disabled} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 ${TONOS_RUTINA[valor]} ${seleccionada ? 'border-current' : 'border-borde'}`}>
            <Icono size={20} aria-hidden="true" />{etiqueta}{seleccionada && <Check size={16} aria-hidden="true" />}
          </button>
        })}
        <button type="button" aria-pressed={extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA} onClick={() => setExtra((actual) => ({ ...actual, categoria: CATEGORIA_RUTINA_PERSONALIZADA }))} disabled={disabled} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 ${extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA ? 'border-secundario bg-secundario/15 text-secundario' : 'border-borde bg-superficie text-secundario'}`}>
          <SquaresFour size={20} aria-hidden="true" />Otra categoría{extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA && <Check size={16} aria-hidden="true" />}
        </button>
      </div>
      <p className={`mt-1 text-sm ${errores.categoria ? 'text-error' : 'text-texto-suave'}`} role={errores.categoria ? 'alert' : undefined}>{errores.categoria || 'Elegí una sola categoría.'}</p>
      {extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA && <div className="mt-3">
        <label htmlFor="categoria-personalizada-rutina" className="mb-2 block font-semibold">Nombre de la nueva categoría</label>
        <input id="categoria-personalizada-rutina" value={extra.categoriaNombre ?? ''} onChange={(event) => setExtra((actual) => ({ ...actual, categoriaNombre: event.target.value }))} maxLength={60} disabled={disabled} aria-invalid={Boolean(errores.categoriaNombre)} className="min-h-11 w-full rounded-md border border-borde bg-superficie px-4 py-2 focus-visible:outline-2 focus-visible:outline-primario" placeholder="Ej. Preparación para salir" />
        {errores.categoriaNombre && <p role="alert" className="mt-1 text-sm text-error">{errores.categoriaNombre}</p>}
        <p className="mt-1 text-sm text-texto-suave">La categoría aparecerá como filtro cuando guardes este aporte.</p>
      </div>}
    </fieldset>
  )

  return <fieldset>
    <legend className="mb-2 font-semibold">¿Dónde suele ocurrir? <span className="font-normal text-texto-suave">Opcional</span></legend>
    <div className="flex flex-wrap gap-2">
      {CONTEXTOS_RUTINA.map(([valor, etiqueta]) => {
        const seleccionada = extra.contextos?.includes(valor) ?? false
        return <CasillaOvillo key={valor} tamano="chico" className="min-h-11 rounded-full border border-borde bg-superficie px-3 has-checked:border-secundario has-checked:bg-secundario/10" checked={seleccionada} onChange={(event) => setExtra((actual) => ({ ...actual, contextos: event.target.checked ? [...(actual.contextos ?? []), valor] : (actual.contextos ?? []).filter((item) => item !== valor) }))} disabled={disabled}>{etiqueta}</CasillaOvillo>
      })}
    </div>
    {extra.contextos?.includes('OTRO') && <CampoDetalleOtro id="contexto-otro-rutina" valor={extra.contextoOtro} onCambiar={(texto) => setExtra((actual) => ({ ...actual, contextoOtro: texto }))} disabled={disabled} error={errores?.contextoOtro} />}
    <p className="mt-1 text-sm text-texto-suave">Sirve para entender dónde se observa esta rutina. No es una categoría.</p>
  </fieldset>
}

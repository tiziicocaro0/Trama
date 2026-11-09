import Campo from '../../../components/ui/Campo.jsx'
import { LARGO_DETALLE_OTRO } from '../camposAporte.js'

// Aparece al elegir «Otro»: un texto corto y opcional para decir cuál
export default function CampoDetalleOtro({ id, valor, onCambiar, disabled, error, etiqueta = '¿Cuál?' }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="mb-2 block font-semibold">
        {etiqueta} <span className="font-normal text-texto-suave">Opcional</span>
      </label>
      <Campo
        id={id}
        value={valor ?? ''}
        maxLength={LARGO_DETALLE_OTRO}
        onChange={(evento) => onCambiar(evento.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}

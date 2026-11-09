import Boton from '../../../components/ui/Boton.jsx'
import SelectorVisibilidad from '../../../components/ui/SelectorVisibilidad.jsx'

export default function PieEditorAporte({ tipo, visibilidad, onVisibilidad, disabled, errorVisibilidad, sustantivo, alCancelar }) {
  return (
    <>
      <SelectorVisibilidad id={`visibilidad-aporte-${tipo}`} value={visibilidad} onChange={onVisibilidad} disabled={disabled} />
      {errorVisibilidad && <p role="alert" className="text-sm text-error">{errorVisibilidad}</p>}
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" disabled={disabled}>{disabled ? 'Guardando…' : `Guardar ${sustantivo}`}</Boton>
        <Boton variant="secondary" onClick={alCancelar} disabled={disabled}>Cancelar</Boton>
      </div>
    </>
  )
}

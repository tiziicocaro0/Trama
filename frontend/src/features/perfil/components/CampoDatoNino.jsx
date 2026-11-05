import Campo from '../../../components/ui/Campo.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CampoSelector from '../../../components/ui/CampoSelector.jsx'
import { opcionesSelector } from '../datosEscolares.js'

// Un dato del niño en el alta o en la edición: texto, fecha o lista de opciones.
// Lo envuelve un CampoFormulario, que le agrega el id, el error y la ayuda.
export default function CampoDatoNino({
  campo,
  valor,
  onChange,
  fechaMaxima,
  disabled,
  ...props
}) {
  if (campo.tipo === 'fecha')
    return (
      <CampoFecha
        {...props}
        name={campo.nombre}
        value={valor}
        onChange={onChange}
        max={fechaMaxima}
        disabled={disabled}
        required
      />
    )
  if (campo.tipo === 'selector')
    return (
      <CampoSelector
        {...props}
        name={campo.nombre}
        value={valor}
        onChange={onChange}
        opciones={opcionesSelector(campo.opciones, valor, campo.vacia)}
        disabled={disabled}
        required
      />
    )
  return (
    <Campo
      {...props}
      name={campo.nombre}
      type="text"
      maxLength={campo.maxLength}
      value={valor}
      onChange={onChange}
      required={!campo.opcional}
      disabled={disabled}
    />
  )
}

import FotoCircular from '../../../components/ui/FotoCircular.jsx'
import useFotoNino from '../useFotoNino.js'

// Foto del niño para cabeceras y tarjetas.
export default function FotoNino({ proyecto, ...props }) {
  return <FotoCircular src={useFotoNino(proyecto)} nombre={proyecto.nombre} {...props} />
}

import FotoCircular from '../../components/ui/FotoCircular.jsx'
import useFotoUsuario from './useFotoUsuario.js'

// Foto de la cuenta de una persona (por ejemplo, en la Red).
export default function FotoUsuario({ usuarioId, tieneFoto, nombre, ...props }) {
  return <FotoCircular src={useFotoUsuario(usuarioId, tieneFoto)} nombre={nombre} {...props} />
}

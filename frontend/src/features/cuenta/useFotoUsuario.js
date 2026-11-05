import useImagenRemota from '../../hooks/useImagenRemota.js'
import { obtenerFotoUsuario } from '../../api/fotos.js'

// Foto de la cuenta de una persona. version: cambia cuando la persona sube otra foto.
export default function useFotoUsuario(usuarioId, tieneFoto, version = 0) {
  return useImagenRemota(usuarioId && tieneFoto ? `${usuarioId}:${version}` : null, (signal) =>
    obtenerFotoUsuario(usuarioId, signal),
  )
}

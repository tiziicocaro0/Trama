import useImagenRemota from '../../hooks/useImagenRemota.js'
import { obtenerVistaImagen } from '../../api/archivos.js'

// Foto del niño: es un archivo de su proyecto, así la ve toda su red.
export default function useFotoNino(proyecto) {
  const { id, fotoArchivoId } = proyecto ?? {}
  return useImagenRemota(id && fotoArchivoId ? `${id}:${fotoArchivoId}` : null, () =>
    obtenerVistaImagen(id, fotoArchivoId),
  )
}

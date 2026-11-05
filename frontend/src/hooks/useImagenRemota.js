import { useEffect, useState } from 'react'

// Carga una imagen protegida (con el token) y la expone como URL local.
// Libera la URL al desmontar o al cambiar de imagen. clave = null: no hay imagen.
export default function useImagenRemota(clave, cargar) {
  const [estado, setEstado] = useState({ clave: null, url: null })

  useEffect(() => {
    if (!clave) return undefined
    const controller = new AbortController()
    let url = null
    cargar(controller.signal).then(
      (resultado) => {
        url = resultado
        if (!controller.signal.aborted) setEstado({ clave, url: resultado })
        else if (resultado) window.URL.revokeObjectURL(resultado)
      },
      () => {
        if (!controller.signal.aborted) setEstado({ clave, url: null })
      },
    )
    return () => {
      controller.abort()
      if (url) window.URL.revokeObjectURL(url)
    }
    // cargar cambia en cada render; la imagen depende solo de la clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  return estado.clave === clave ? estado.url : null
}

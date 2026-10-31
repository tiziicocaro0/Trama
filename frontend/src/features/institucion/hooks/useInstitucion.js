import { useEffect, useState } from 'react'
import { obtenerPaginaInstitucion } from '../../../api/instituciones.js'

// 9.2: datos de la página /institucion. «actualizar» guarda la institución que devuelven
// contratar, asociar y quitar, sin volver a pedir todo.
export default function useInstitucion() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      try {
        const pagina = await obtenerPaginaInstitucion(controller.signal)
        if (!controller.signal.aborted) setResultado({ intento, pagina })
      } catch {
        if (controller.signal.aborted) return
        setResultado({
          intento,
          error: 'No pudimos cargar la institución. Revisá tu conexión e intentá nuevamente.',
        })
      }
    }
    void cargar()
    return () => controller.abort()
  }, [intento])

  const vigente = resultado?.intento === intento
  return {
    pagina: vigente ? resultado.pagina : null,
    error: vigente ? resultado.error : null,
    cargando: !vigente,
    reintentar: () => setIntento((anterior) => anterior + 1),
    actualizar: (institucion) =>
      setResultado((anterior) => ({ ...anterior, pagina: { ...anterior.pagina, institucion } })),
  }
}

import { useEffect, useState } from 'react'
import { obtenerMiPlan } from '../../../api/planes.js'

// 9.1: carga el plan del usuario. «actualizar» reemplaza el plan con la respuesta
// de suscribirse o cancelar, sin volver a pedirlo.
export default function useMiPlan() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      try {
        const plan = await obtenerMiPlan(controller.signal)
        if (!controller.signal.aborted) setResultado({ intento, plan })
      } catch {
        if (controller.signal.aborted) return
        setResultado({
          intento,
          error: 'No pudimos cargar tu plan. Revisá tu conexión e intentá nuevamente.',
        })
      }
    }
    void cargar()
    return () => controller.abort()
  }, [intento])

  const vigente = resultado?.intento === intento
  return {
    plan: vigente ? resultado.plan : null,
    error: vigente ? resultado.error : null,
    cargando: !vigente,
    reintentar: () => setIntento((anterior) => anterior + 1),
    actualizar: (plan) => setResultado({ intento, plan }),
  }
}

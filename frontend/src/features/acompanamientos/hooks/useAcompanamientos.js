import { useEffect, useState } from 'react'
import { listarMisProyectos, obtenerProyecto } from '../../../api/proyectos.js'

export default function useAcompanamientos() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function cargar() {
      try {
        const lista = await listarMisProyectos(controller.signal)
        if (controller.signal.aborted) return
        // El listado no incluye la fecha de nacimiento; se obtiene del detalle real.
        const proyectos = await Promise.all(
          lista.map((item) => obtenerProyecto(item.id, controller.signal)),
        )
        if (!controller.signal.aborted) setResultado({ intento, proyectos })
      } catch (error) {
        if (controller.signal.aborted) return
        const estado = error.response?.status
        const mensaje =
          estado === 401
            ? 'Tu sesión venció. Ingresá nuevamente.'
            : estado === 403
              ? 'No tenés permiso para consultar estos acompañamientos.'
              : 'No pudimos cargar los acompañamientos. Revisá tu conexión e intentá nuevamente.'
        setResultado({ intento, error: mensaje })
      }
    }
    void cargar()
    return () => controller.abort()
  }, [intento])

  return {
    proyectos: resultado?.intento === intento ? resultado.proyectos : null,
    error: resultado?.intento === intento ? resultado.error : null,
    cargando: resultado?.intento !== intento,
    reintentar: () => setIntento((anterior) => anterior + 1),
  }
}

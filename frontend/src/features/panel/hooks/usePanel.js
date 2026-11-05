import { useEffect, useState } from 'react'
import { obtenerResumenPanel } from '../../../api/panel.js'

export default function usePanel() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const datos = await obtenerResumenPanel()
        if (!cancelado) setResultado({ intento, datos, error: null, noAutorizado: false })
      } catch (error) {
        if (cancelado) return
        const status = error.response?.status
        const noAutorizado = status === 403
        const mensaje =
          status === 401
            ? 'Tu sesión venció. Ingresá nuevamente.'
            : status === 403
              ? 'Esta sección es exclusiva para profesionales de educación o salud.'
              : 'No pudimos cargar el panel. Revisá tu conexión e intentá nuevamente.'
        setResultado({ intento, datos: null, error: mensaje, noAutorizado })
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [intento])

  return {
    ninos: resultado?.intento === intento ? resultado.datos : null,
    error: resultado?.intento === intento ? resultado.error : null,
    noAutorizado: resultado?.intento === intento ? Boolean(resultado.noAutorizado) : false,
    cargando: resultado?.intento !== intento,
    reintentar: () => setIntento((prev) => prev + 1),
  }
}


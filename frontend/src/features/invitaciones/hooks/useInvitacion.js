import { useEffect, useState } from 'react'
import { consultarInvitacion } from '../../../api/invitaciones.js'

// 1.4: datos públicos de la invitación (niño, quién invita y con qué rol).
export default function useInvitacion(token) {
  const [estado, setEstado] = useState({ cargando: true, detalle: null, error: '' })

  useEffect(() => {
    const control = new AbortController()
    consultarInvitacion(token, control.signal)
      .then((detalle) => setEstado({ cargando: false, detalle, error: '' }))
      .catch((error) => {
        if (control.signal.aborted) return
        setEstado({ cargando: false, detalle: null, error: error.message })
      })
    return () => control.abort()
  }, [token])

  return estado
}

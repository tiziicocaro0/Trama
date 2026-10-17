import { useEffect, useState } from 'react'
import { obtenerProyecto } from '../../../api/proyectos.js'

export default function usePerfil(id, cargarDatos) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)
  const clave = `${id}:${intento}`

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      obtenerProyecto(id, controller.signal),
      cargarDatos ? cargarDatos(id, controller.signal) : Promise.resolve(null),
    ]).then(
      ([proyecto, datos]) => {
        if (!controller.signal.aborted) setResultado({ clave, proyecto, datos })
      },
      (error) => {
        if (controller.signal.aborted) return
        const estado = error.response?.status
        const mensaje =
          estado === 403
            ? 'No tenés permiso para ver este proyecto.'
            : estado === 404
              ? 'No encontramos este proyecto.'
              : estado === 401
                ? 'Tu sesión venció. Ingresá nuevamente.'
                : 'No pudimos cargar el perfil. Revisá tu conexión e intentá nuevamente.'
        setResultado({ clave, error: mensaje })
      },
    )
    return () => controller.abort()
  }, [id, clave, cargarDatos])

  return {
    proyecto: resultado?.clave === clave ? resultado.proyecto : null,
    datos: resultado?.clave === clave ? resultado.datos : null,
    error: resultado?.clave === clave ? resultado.error : null,
    cargando: resultado?.clave !== clave,
    reintentar: () => setIntento((actual) => actual + 1),
  }
}

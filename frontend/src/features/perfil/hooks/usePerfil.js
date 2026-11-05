import { useEffect, useState } from 'react'
import { obtenerProyecto } from '../../../api/proyectos.js'
import { usePerfilDelLayout } from '../PerfilContext.js'

// Proyecto y datos de una sección del perfil. Dentro de PerfilLayout el proyecto ya
// está cargado: acá solo se piden los datos de la sección (miembros, eventos…).
export default function usePerfil(id, cargarDatos) {
  const delLayout = usePerfilDelLayout()
  const proyectoDelLayout =
    delLayout?.proyecto && String(delLayout.proyecto.id) === String(id) ? delLayout.proyecto : null
  const enLayout = Boolean(proyectoDelLayout)
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)
  const clave = `${id}:${intento}:${enLayout}`
  const sinPedidos = enLayout && !cargarDatos

  useEffect(() => {
    if (sinPedidos) return undefined
    const controller = new AbortController()
    Promise.all([
      enLayout ? Promise.resolve(null) : obtenerProyecto(id, controller.signal),
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
  }, [id, clave, cargarDatos, enLayout, sinPedidos])

  const vigente = resultado?.clave === clave
  return {
    proyecto: proyectoDelLayout ?? (vigente ? resultado.proyecto : null),
    datos: vigente ? resultado.datos : null,
    error: vigente ? resultado.error : null,
    cargando: sinPedidos ? false : !vigente,
    reintentar: () => {
      delLayout?.recargarProyecto?.()
      setIntento((actual) => actual + 1)
    },
  }
}

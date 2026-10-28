import cliente from './cliente.js'

export const TAMANO_MAXIMO_ARCHIVO = 20 * 1024 * 1024 // 20 MB

const EXTENSIONES_VALIDAS = ['pdf', 'jpg', 'jpeg', 'png']
const MIMES_VALIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

export function validarArchivoAdjunto(archivo) {
  if (!archivo) {
    return 'Seleccioná un archivo para adjuntar.'
  }

  const nombre = (archivo.name ?? '').trim()
  const partes = nombre.split('.')
  const extension =
    partes.length > 1 ? partes.at(-1).toLowerCase() : ''
  const tipoMime = (archivo.type ?? '').toLowerCase()

  const extensionValida = EXTENSIONES_VALIDAS.includes(extension)
  const mimeValido = MIMES_VALIDOS.includes(tipoMime)

  if (
    !extensionValida ||
    (tipoMime &&
      tipoMime !== 'application/octet-stream' &&
      !mimeValido)
  ) {
    return 'Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG.'
  }

  if (typeof archivo.size === 'number' && archivo.size <= 0) {
    return 'El archivo seleccionado está vacío.'
  }

  if (typeof archivo.size === 'number' && archivo.size > TAMANO_MAXIMO_ARCHIVO) {
    return 'El archivo supera el tamaño máximo permitido de 20 MB.'
  }

  return null
}

export function obtenerUrlDescargaArchivo(proyectoId, archivoId) {
  const base = cliente.defaults.baseURL || '/api'
  const prefijo = base.endsWith('/') ? base.slice(0, -1) : base
  if (!proyectoId) {
    return `${prefijo}/archivos/${encodeURIComponent(archivoId)}`
  }
  return `${prefijo}/proyectos/${encodeURIComponent(proyectoId)}/archivos/${encodeURIComponent(archivoId)}`
}

export async function subirArchivo(proyectoId, archivo) {
  if (!cliente.defaults.baseURL) {
    throw new Error('Falta configurar la conexión con TRAMA.')
  }

  const errorValidacion = validarArchivoAdjunto(archivo)
  if (errorValidacion) {
    throw new Error(errorValidacion)
  }

  const formData = new FormData()
  formData.append('archivo', archivo)

  try {
    const { data } = await cliente.post(
      `/proyectos/${encodeURIComponent(proyectoId)}/archivos`,
      formData,
    )
    if (typeof data?.id !== 'string' || !data.id.trim()) {
      throw new Error('No pudimos confirmar la subida del archivo.')
    }
    return data
  } catch (error) {
    if (error.message && !error.response) {
      throw error
    }
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data?.mensaje ||
          'El archivo no es válido. Solo podés adjuntar PDF, JPG o PNG de hasta 20 MB.',
        { cause: error },
      )
    }
    if (error.response?.status === 403) {
      throw new Error(
        'No tenés permiso para adjuntar archivos en este proyecto.',
        { cause: error },
      )
    }
    throw new Error(
      'No pudimos subir el archivo. Intentá nuevamente.',
      { cause: error },
    )
  }
}

export async function descargarArchivo(proyectoId, archivoId, nombreOriginal) {
  if (!cliente.defaults.baseURL) {
    throw new Error('Falta configurar la conexión con TRAMA.')
  }

  try {
    const respuesta = await cliente.get(
      `/proyectos/${encodeURIComponent(proyectoId)}/archivos/${encodeURIComponent(archivoId)}`,
      { responseType: 'blob' },
    )

    if (
      typeof window !== 'undefined' &&
      typeof window.URL?.createObjectURL === 'function' &&
      respuesta?.data
    ) {
      const blob =
        respuesta.data instanceof Blob
          ? respuesta.data
          : new Blob([respuesta.data])
      const urlBlob = window.URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = urlBlob
      enlace.download = nombreOriginal || 'adjunto'
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      window.URL.revokeObjectURL?.(urlBlob)
    }

    return respuesta?.data
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error(
        'No tenés permiso para descargar este archivo.',
        { cause: error },
      )
    }
    throw new Error(
      'No pudimos descargar el archivo. Intentá nuevamente.',
      { cause: error },
    )
  }
}


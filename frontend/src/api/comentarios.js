import cliente from './cliente.js'

function ruta(proyectoId, aporteId) {
  if (!cliente.defaults.baseURL) throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/aportes/${encodeURIComponent(aporteId)}/comentarios`
}

function esComentario(comentario, aporteId) {
  return Boolean(comentario && typeof comentario.id === 'string' && comentario.aporteId === aporteId &&
    typeof comentario.autorNombre === 'string' && typeof comentario.texto === 'string' && typeof comentario.fecha === 'string')
}

function traducirError(error) {
  if (error.response?.status === 401) return new Error('Tu sesión venció. Ingresá nuevamente.')
  if (error.response?.status === 403) return new Error('No tenés permiso para acceder a estos comentarios.')
  if ([400, 404, 409].includes(error.response?.status) && error.response?.data?.mensaje) return new Error(error.response.data.mensaje)
  return new Error('No pudimos completar la operación. Intentá nuevamente.')
}

export async function listarComentarios(proyectoId, aporteId, signal) {
  try {
    const { data } = await cliente.get(ruta(proyectoId, aporteId), { signal })
    if (!Array.isArray(data) || data.some((comentario) => !esComentario(comentario, aporteId))) throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    throw traducirError(error)
  }
}

export async function crearComentario(proyectoId, aporteId, texto) {
  try {
    const { data } = await cliente.post(ruta(proyectoId, aporteId), { texto })
    if (!esComentario(data, aporteId)) throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    throw traducirError(error)
  }
}

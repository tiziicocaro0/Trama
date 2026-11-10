import cliente from './cliente.js'

// 6.2: comentarios de un aporte. Las @menciones las detecta el back y avisa a la persona.
const rutaComentarios = (proyectoId, aporteId) =>
  `/proyectos/${encodeURIComponent(proyectoId)}/aportes/${encodeURIComponent(aporteId)}/comentarios`

export async function listarComentarios(proyectoId, aporteId, signal) {
  try {
    const { data } = await cliente.get(rutaComentarios(proyectoId, aporteId), { signal })
    if (!Array.isArray(data)) throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error?.name === 'CanceledError') throw error
    throw new Error('No pudimos traer los comentarios.', { cause: error })
  }
}

export async function comentar(proyectoId, aporteId, texto) {
  try {
    const { data } = await cliente.post(rutaComentarios(proyectoId, aporteId), { texto: texto.trim() })
    return data
  } catch (error) {
    throw new Error(error?.response?.data?.mensaje || 'No pudimos publicar el comentario. Probá de nuevo.', {
      cause: error,
    })
  }
}

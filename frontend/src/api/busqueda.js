import cliente from './cliente.js'

// 4.5: buscar una palabra en el perfil. El back solo devuelve lo que la persona puede ver.
export async function buscarEnPerfil(proyectoId, consulta, signal) {
  try {
    const { data } = await cliente.get(`/proyectos/${encodeURIComponent(proyectoId)}/buscar`, {
      params: { q: consulta.trim() },
      signal,
    })
    if (!Array.isArray(data)) throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error?.name === 'CanceledError') throw error
    throw new Error(error?.response?.data?.mensaje || 'No pudimos buscar. Probá de nuevo.', { cause: error })
  }
}

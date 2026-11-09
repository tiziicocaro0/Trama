import cliente from './cliente.js'

function rutaProyecto(proyectoId) {
  return `/proyectos/${encodeURIComponent(proyectoId)}`
}

function errorRevision(error) {
  const estado = error.response?.status
  if (estado === 401) return new Error('Tu sesión venció. Ingresá nuevamente.')
  if (estado === 403) return new Error('No tenés permiso para realizar esta acción.')
  if ([400, 404, 409].includes(estado)) {
    return new Error(error.response?.data?.mensaje || 'No pudimos completar la revisión. Volvé a cargar el perfil.')
  }
  return new Error('No pudimos completar la revisión. Intentá nuevamente.')
}

export async function solicitarRevision(proyectoId, aporteId, motivo) {
  try {
    const { data } = await cliente.post(`${rutaProyecto(proyectoId)}/aportes/${encodeURIComponent(aporteId)}/revision`, { motivo })
    if (!data?.id || data.estado !== 'PENDIENTE') throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    throw errorRevision(error)
  }
}

export async function obtenerRevision(proyectoId, revisionId, signal) {
  try {
    const { data } = await cliente.get(`${rutaProyecto(proyectoId)}/revisiones/${encodeURIComponent(revisionId)}`, { signal })
    if (data?.id !== revisionId || typeof data.motivo !== 'string') throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    throw errorRevision(error)
  }
}

export async function marcarRevision(proyectoId, revisionId) {
  try {
    const { data } = await cliente.put(`${rutaProyecto(proyectoId)}/revisiones/${encodeURIComponent(revisionId)}`)
    if (data?.id !== revisionId || data.estado !== 'REVISADA') throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    throw errorRevision(error)
  }
}

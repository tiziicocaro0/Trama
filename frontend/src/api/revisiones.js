import cliente from './cliente.js'

// 3.4: un tutor pide revisar el aporte de otra persona; el autor ve el motivo y lo marca como revisado.
const rutaProyecto = (proyectoId) => `/proyectos/${encodeURIComponent(proyectoId)}`

function traducirError(error, porDefecto) {
  const mensaje = error?.response?.data?.mensaje
  if (error?.response?.status === 403) return new Error('No tenés permiso para hacer esto.', { cause: error })
  return new Error(mensaje || porDefecto, { cause: error })
}

export async function pedirRevision(proyectoId, aporteId, motivo) {
  try {
    const { data } = await cliente.post(
      `${rutaProyecto(proyectoId)}/aportes/${encodeURIComponent(aporteId)}/revision`,
      { motivo: motivo.trim() },
    )
    return data
  } catch (error) {
    throw traducirError(error, 'No pudimos pedir la revisión. Probá de nuevo.')
  }
}

export async function obtenerRevision(proyectoId, revisionId) {
  try {
    const { data } = await cliente.get(`${rutaProyecto(proyectoId)}/revisiones/${encodeURIComponent(revisionId)}`)
    return data
  } catch (error) {
    throw traducirError(error, 'No pudimos traer el motivo de la revisión.')
  }
}

export async function marcarRevisada(proyectoId, revisionId) {
  try {
    const { data } = await cliente.put(`${rutaProyecto(proyectoId)}/revisiones/${encodeURIComponent(revisionId)}`)
    return data
  } catch (error) {
    throw traducirError(error, 'No pudimos marcarla como revisada. Probá de nuevo.')
  }
}

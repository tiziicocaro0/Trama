import cliente from './cliente.js'

// 5.6: acuerdos de una reunión (responsable, fecha de revisión y si se cumplió).
function ruta(proyectoId, acuerdoId = '') {
  if (!cliente.defaults.baseURL) {
    throw new Error('Falta configurar la conexión con TRAMA.')
  }
  const base = `/proyectos/${encodeURIComponent(proyectoId)}/acuerdos`
  return acuerdoId ? `${base}/${encodeURIComponent(acuerdoId)}` : base
}

function traducirError(error, porDefecto) {
  return new Error(error?.response?.data?.mensaje || porDefecto, { cause: error })
}

export async function listarAcuerdos(proyectoId, reunionId, signal) {
  try {
    const { data } = await cliente.get(ruta(proyectoId), { params: { reunionId }, signal })
    if (!Array.isArray(data)) throw new Error('Respuesta inválida')
    return data
  } catch (error) {
    if (error?.name === 'CanceledError') throw error
    throw traducirError(error, 'No pudimos cargar los acuerdos.')
  }
}

export async function crearAcuerdo(proyectoId, { reunionId, descripcion, responsableId, fechaRevision }) {
  try {
    const { data } = await cliente.post(ruta(proyectoId), {
      reunionId,
      descripcion: descripcion?.trim(),
      responsableId,
      fechaRevision,
    })
    return data
  } catch (error) {
    throw traducirError(error, 'No pudimos guardar el acuerdo.')
  }
}

export async function marcarAcuerdoCumplido(proyectoId, acuerdoId, cumplido) {
  try {
    const { data } = await cliente.put(`${ruta(proyectoId, acuerdoId)}/cumplido`, { cumplido })
    return data
  } catch (error) {
    throw traducirError(error, 'No pudimos actualizar el acuerdo.')
  }
}

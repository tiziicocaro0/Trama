import cliente from './cliente.js'

function ruta(proyectoId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/aportes`
}

export async function listarAportes(proyectoId, signal) {
  const { data } = await cliente.get(ruta(proyectoId), { signal })
  if (
    !Array.isArray(data?.aportes) ||
    typeof data.puedeCrear !== 'boolean' ||
    data.aportes.some(
      (aporte) =>
        typeof aporte?.id !== 'string' ||
        typeof aporte.titulo !== 'string' ||
        typeof aporte.tipo !== 'string' ||
        typeof aporte.puedeEditar !== 'boolean',
    )
  ) {
    throw new Error('No pudimos verificar los aportes del perfil.')
  }
  return data
}

export async function guardarAporte(proyectoId, aporteId, datos) {
  try {
    const url = ruta(proyectoId)
    const { data } = aporteId
      ? await cliente.put(`${url}/${encodeURIComponent(aporteId)}`, datos)
      : await cliente.post(url, datos)
    if (typeof data?.id !== 'string' || !data.id.trim())
      throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error.response?.status === 403)
      throw new Error(
        'No tenés permiso para editar este aporte. Solo su autor puede modificarlo.',
      )
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.')
    if (error.response?.status === 404)
      throw new Error('No encontramos este aporte. Volvé a cargar el perfil.')
    if (error.response?.status === 400)
      throw new Error('Revisá el título, la descripción y la visibilidad.')
    throw new Error(
      'No pudimos confirmar el guardado. Revisá el perfil antes de volver a intentarlo.',
    )
  }
}

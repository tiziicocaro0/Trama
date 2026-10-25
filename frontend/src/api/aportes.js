import cliente from './cliente.js'

function ruta(proyectoId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/aportes`
}

function traducirErrorAporte(error, accion = 'guardar') {
  if (error.response?.status === 403) {
    return new Error(
      accion === 'archivar'
        ? 'No tenés permiso para archivar este aporte. Solo su autor puede archivarlo.'
        : 'No tenés permiso para editar este aporte. Solo su autor puede modificarlo.',
      { cause: error },
    )
  }
  if (error.response?.status === 401)
    return new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
  if (error.response?.status === 404)
    return new Error('No encontramos este aporte. Volvé a cargar el perfil.', {
      cause: error,
    })
  if (error.response?.status === 400)
    return new Error('Revisá el título, la descripción y la visibilidad.', {
      cause: error,
    })
  return new Error(
    accion === 'archivar'
      ? 'No pudimos archivar el aporte. Intentá nuevamente.'
      : 'No pudimos confirmar el guardado. Revisá el perfil antes de volver a intentarlo.',
    { cause: error },
  )
}

export async function listarAportes(proyectoId, signalOrOpciones) {
  // La API (3.0) devuelve la lista de aportes visibles para el usuario.
  // El permiso de cargar viene en el proyecto (puedeCargar).
  const esSignal =
    signalOrOpciones instanceof AbortSignal ||
    typeof signalOrOpciones?.aborted === 'boolean'
  const signal = esSignal ? signalOrOpciones : signalOrOpciones?.signal
  const tipo = !esSignal ? signalOrOpciones?.tipo : undefined
  const archivados = !esSignal ? signalOrOpciones?.archivados : undefined

  const params = {}
  if (tipo) params.tipo = tipo
  if (typeof archivados === 'boolean') params.archivados = archivados

  const config =
    Object.keys(params).length > 0
      ? { ...(signal ? { signal } : {}), params }
      : { signal }

  const { data } = await cliente.get(ruta(proyectoId), config)
  if (
    !Array.isArray(data) ||
    data.some(
      (aporte) =>
        typeof aporte?.id !== 'string' ||
        typeof aporte.titulo !== 'string' ||
        typeof aporte.tipo !== 'string' ||
        typeof aporte.puedeEditar !== 'boolean',
    )
  ) {
    throw new Error('No pudimos verificar los aportes del perfil.')
  }
  return { aportes: data }
}

export async function crearAporte(proyectoId, datos) {
  try {
    const { data } = await cliente.post(ruta(proyectoId), datos)
    if (typeof data?.id !== 'string' || !data.id.trim())
      throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error.message === 'Falta configurar la conexión con TRAMA.') throw error
    throw traducirErrorAporte(error, 'crear')
  }
}

export async function editarAporte(proyectoId, aporteId, datos) {
  try {
    const url = `${ruta(proyectoId)}/${encodeURIComponent(aporteId)}`
    const { data } = await cliente.put(url, datos)
    if (typeof data?.id !== 'string' || !data.id.trim())
      throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error.message === 'Falta configurar la conexión con TRAMA.') throw error
    throw traducirErrorAporte(error, 'editar')
  }
}

export async function archivarAporte(proyectoId, aporteId) {
  try {
    const url = `${ruta(proyectoId)}/${encodeURIComponent(aporteId)}/archivar`
    await cliente.post(url)
  } catch (error) {
    if (error.message === 'Falta configurar la conexión con TRAMA.') throw error
    throw traducirErrorAporte(error, 'archivar')
  }
}

export async function guardarAporte(proyectoId, aporteId, datos) {
  return aporteId
    ? editarAporte(proyectoId, aporteId, datos)
    : crearAporte(proyectoId, datos)
}

export {
  archivarAporte as archivar,
  crearAporte as crear,
  editarAporte as editar,
  listarAportes as listar,
}

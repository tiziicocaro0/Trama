import cliente from './cliente.js'

function ruta(proyectoId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/aportes`
}

function rutaBitacora(proyectoId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/bitacora`
}

export async function listarAportes(proyectoId, signal) {
  // La API (3.0) devuelve la lista de aportes visibles para el usuario.
  // El permiso de cargar viene en el proyecto (puedeCargar).
  const { data } = await cliente.get(ruta(proyectoId), { signal })
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

export async function listarBitacora(proyectoId, signalOrOpciones) {
  const esSignal =
    signalOrOpciones instanceof AbortSignal ||
    typeof signalOrOpciones?.aborted === 'boolean'
  const signal = esSignal ? signalOrOpciones : signalOrOpciones?.signal
  const opciones = !esSignal && signalOrOpciones ? signalOrOpciones : {}

  const params = {}
  if (opciones.desde) params.desde = opciones.desde
  if (opciones.hasta) params.hasta = opciones.hasta
  if (opciones.contexto) params.contexto = opciones.contexto
  if (opciones.etiqueta) params.etiqueta = opciones.etiqueta
  if (opciones.autorId) params.autorId = opciones.autorId
  if (typeof opciones.pagina === 'number' && opciones.pagina > 0) {
    params.pagina = opciones.pagina
  }

  const config =
    Object.keys(params).length > 0
      ? { ...(signal ? { signal } : {}), params }
      : { signal }

  const { data } = await cliente.get(rutaBitacora(proyectoId), config)
  if (
    !Array.isArray(data) ||
    data.some(
      (aporte) =>
        typeof aporte?.id !== 'string' ||
        typeof aporte.tipo !== 'string' ||
        typeof aporte.datos !== 'string',
    )
  ) {
    throw new Error('No pudimos verificar las observaciones de la bitácora.')
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
        { cause: error },
      )
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
    if (error.response?.status === 404)
      throw new Error('No encontramos este aporte. Volvé a cargar el perfil.', { cause: error })
    if (error.response?.status === 400)
      throw new Error('Revisá el título, la descripción y la visibilidad.', { cause: error })
    throw new Error(
      'No pudimos confirmar el guardado. Revisá el perfil antes de volver a intentarlo.',
      { cause: error },
    )
  }
}

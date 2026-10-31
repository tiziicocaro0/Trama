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

function rutaResumen(proyectoId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  return `/proyectos/${encodeURIComponent(proyectoId)}/resumen`
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

export async function obtenerResumenProyecto(proyectoId, signal) {
  const { data } = await cliente.get(
    rutaResumen(proyectoId),
    ...(signal ? [{ signal }] : []),
  )
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('No pudimos verificar el resumen del perfil.')
  }
  return {
    intereses: Array.isArray(data.intereses) ? data.intereses : [],
    fortalezas: Array.isArray(data.fortalezas) ? data.fortalezas : [],
    comunicacion: Array.isArray(data.comunicacion) ? data.comunicacion : [],
    sensorial: Array.isArray(data.sensorial) ? data.sensorial : [],
    estrategias: Array.isArray(data.estrategias) ? data.estrategias : [],
    desregulacion: Array.isArray(data.desregulacion) ? data.desregulacion : [],
  }
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

// 3.3: "Yo también lo observé" / "A mí también me funcionó" en un aporte ajeno
const MENSAJES_CONFIRMACION = {
  APORTE_PROPIO: 'No podés confirmar tu propio aporte.',
  APORTE_ARCHIVADO: 'Este aporte está archivado.',
}

async function cambiarConfirmacion(metodo, proyectoId, aporteId) {
  try {
    const url = `${ruta(proyectoId)}/${encodeURIComponent(aporteId)}/confirmaciones`
    await cliente[metodo](url)
  } catch (error) {
    if (error.message === 'Falta configurar la conexión con TRAMA.') throw error
    const mensaje = MENSAJES_CONFIRMACION[error.response?.data?.codigo]
    if (mensaje) throw new Error(mensaje, { cause: error })
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
    throw new Error('No pudimos guardar tu confirmación. Intentá nuevamente.', {
      cause: error,
    })
  }
}

export function confirmarAporte(proyectoId, aporteId) {
  return cambiarConfirmacion('post', proyectoId, aporteId)
}

export function quitarConfirmacion(proyectoId, aporteId) {
  return cambiarConfirmacion('delete', proyectoId, aporteId)
}

// 3.2: todas las versiones del aporte, de la más nueva a la más vieja
export async function listarVersiones(proyectoId, aporteId) {
  try {
    const url = `${ruta(proyectoId)}/${encodeURIComponent(aporteId)}/versiones`
    const { data } = await cliente.get(url)
    if (!Array.isArray(data)) throw new Error('Respuesta incompleta')
    return data
  } catch (error) {
    if (error.message === 'Falta configurar la conexión con TRAMA.') throw error
    if (error.response?.status === 403)
      throw new Error('No tenés permiso para ver el historial de este aporte.', {
        cause: error,
      })
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
    if (error.response?.status === 404)
      throw new Error('No encontramos este aporte. Volvé a cargar el perfil.', {
        cause: error,
      })
    throw new Error('No pudimos cargar el historial. Intentá nuevamente.', {
      cause: error,
    })
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

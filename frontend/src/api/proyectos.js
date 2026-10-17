import cliente from './cliente.js'

export async function obtenerRedProyecto(id, signal) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.get(
    `/proyectos/${encodeURIComponent(id)}/red`,
    { signal },
  )
  if (
    !Array.isArray(data) ||
    data.some(
      (persona) =>
        !persona?.id ||
        typeof persona.nombre !== 'string' ||
        typeof persona.apellido !== 'string' ||
        !['SALUD', 'EDUCACION'].includes(persona.rol),
    )
  ) {
    throw new Error('No pudimos verificar los profesionales vinculados.')
  }
  return data
}

export async function crearProyecto(datos) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  let respuesta
  try {
    respuesta = await cliente.post('/proyectos', datos)
  } catch (error) {
    if (error.response?.status === 400)
      throw new Error(
        'Revisá los datos y confirmá tu autorización antes de continuar.',
      )
    if (error.response?.status === 401)
      throw new Error('Tu sesión venció. Ingresá nuevamente.')
    if (error.response?.status === 403)
      throw new Error('No tenés permiso para crear este acompañamiento.')
    throw new Error(
      'No pudimos confirmar la creación. Revisá tus acompañamientos antes de volver a intentarlo.',
    )
  }
  if (typeof respuesta.data?.id !== 'string' || !respuesta.data.id.trim()) {
    throw new Error(
      'No recibimos la confirmación. Revisá tus acompañamientos antes de volver a intentarlo.',
    )
  }
  return respuesta.data
}

export async function listarMisProyectos(signal) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  const { data } = await cliente.get('/proyectos', { signal })
  if (
    !Array.isArray(data) ||
    data.some(
      (proyecto) =>
        typeof proyecto?.id !== 'string' ||
        !proyecto.id.trim() ||
        typeof proyecto.nombre !== 'string' ||
        !proyecto.nombre.trim(),
    )
  ) {
    throw new Error('No pudimos verificar la lista de proyectos.')
  }
  return data
}

export async function obtenerProyecto(id, signal) {
  if (!cliente.defaults.baseURL) {
    throw new Error(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }
  const { data } = await cliente.get(`/proyectos/${encodeURIComponent(id)}`, {
    signal,
  })
  if (
    data?.id !== id ||
    typeof data.nombre !== 'string' ||
    !data.nombre.trim()
  ) {
    throw new Error('No pudimos verificar los datos del proyecto.')
  }
  return data
}

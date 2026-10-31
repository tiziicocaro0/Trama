import cliente from './cliente.js'

function rutaEventos(proyectoId, eventoId) {
  if (!cliente.defaults.baseURL) {
    throw new Error('Falta configurar la conexión con TRAMA.')
  }
  const base = `/proyectos/${encodeURIComponent(proyectoId)}/eventos`
  return eventoId ? `${base}/${encodeURIComponent(eventoId)}` : base
}

function traducirErrorEvento(error, accion = 'guardar') {
  if (error?.response?.data?.mensaje) {
    return new Error(error.response.data.mensaje, { cause: error })
  }
  if (error?.response?.status === 403) {
    return new Error(
      accion === 'eliminar'
        ? 'No tenés permiso para eliminar este evento. Solo su autor o un tutor pueden borrarlo.'
        : 'No tenés permiso para modificar este evento. Solo su autor o un tutor pueden editarlo.',
      { cause: error },
    )
  }
  if (error?.response?.status === 401) {
    return new Error('Tu sesión venció. Ingresá nuevamente.', { cause: error })
  }
  if (error?.response?.status === 404) {
    return new Error('No encontramos este evento en el calendario.', {
      cause: error,
    })
  }
  if (error?.response?.status === 400) {
    return new Error('Revisá el título, la fecha y el horario del evento.', {
      cause: error,
    })
  }
  return new Error(
    accion === 'eliminar'
      ? 'No pudimos eliminar el evento. Intentá nuevamente.'
      : 'No pudimos guardar el evento. Intentá nuevamente.',
    { cause: error },
  )
}

function rutaOcurrenciaEvento(proyectoId, eventoId, fecha) {
  return `${rutaEventos(proyectoId, eventoId)}/ocurrencias/${encodeURIComponent(fecha)}`
}

function armarCuerpoEvento({
  titulo,
  descripcion,
  fecha,
  horaInicio,
  horaFin,
  imagenId,
  recurrente,
  diaSemana,
  fechaFinRecurrencia,
}) {
  const textoDescripcion =
    typeof descripcion === 'string' && descripcion.trim()
      ? descripcion.trim()
      : null
  const esRecurrente = Boolean(recurrente)
  const diaNumero =
    esRecurrente && diaSemana != null && diaSemana !== ''
      ? Number(diaSemana)
      : null
  const fechaFinLimpia =
    esRecurrente &&
    typeof fechaFinRecurrencia === 'string' &&
    fechaFinRecurrencia.trim()
      ? fechaFinRecurrencia.trim()
      : null

  return {
    titulo: typeof titulo === 'string' ? titulo.trim() : '',
    descripcion: textoDescripcion,
    fecha,
    horaInicio,
    horaFin,
    imagenId: imagenId ?? null,
    recurrente: esRecurrente,
    diaSemana: diaNumero,
    fechaFinRecurrencia: fechaFinLimpia,
  }
}

function armarCuerpoOcurrencia({ titulo, horaInicio, horaFin }) {
  return {
    titulo: typeof titulo === 'string' ? titulo.trim() : '',
    horaInicio,
    horaFin,
  }
}

export async function listarEventos(proyectoId, opciones = {}) {
  const esSignal =
    opciones instanceof AbortSignal || typeof opciones?.aborted === 'boolean'
  const signal = esSignal ? opciones : opciones?.signal
  const desde = !esSignal ? opciones?.desde : undefined
  const hasta = !esSignal ? opciones?.hasta : undefined

  const params = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta

  const config =
    Object.keys(params).length > 0
      ? { ...(signal ? { signal } : {}), params }
      : { ...(signal ? { signal } : {}) }

  const { data } = await cliente.get(rutaEventos(proyectoId), config)
  if (!Array.isArray(data)) {
    throw new Error('No pudimos verificar los eventos del calendario.')
  }
  return data
}

export async function crearEvento(proyectoId, datos) {
  try {
    const { data } = await cliente.post(
      rutaEventos(proyectoId),
      armarCuerpoEvento(datos),
    )
    return data
  } catch (error) {
    throw traducirErrorEvento(error, 'crear')
  }
}

export async function editarEvento(proyectoId, eventoId, datos) {
  try {
    const { data } = await cliente.put(
      rutaEventos(proyectoId, eventoId),
      armarCuerpoEvento(datos),
    )
    return data
  } catch (error) {
    throw traducirErrorEvento(error, 'editar')
  }
}

export async function eliminarEvento(proyectoId, eventoId) {
  try {
    await cliente.delete(rutaEventos(proyectoId, eventoId))
  } catch (error) {
    throw traducirErrorEvento(error, 'eliminar')
  }
}

export async function editarOcurrenciaEvento(
  proyectoId,
  eventoId,
  fecha,
  datos,
) {
  try {
    await cliente.put(
      rutaOcurrenciaEvento(proyectoId, eventoId, fecha),
      armarCuerpoOcurrencia(datos),
    )
  } catch (error) {
    throw traducirErrorEvento(error, 'editar')
  }
}

export async function cancelarOcurrenciaEvento(proyectoId, eventoId, fecha) {
  try {
    await cliente.delete(rutaOcurrenciaEvento(proyectoId, eventoId, fecha))
  } catch (error) {
    throw traducirErrorEvento(error, 'eliminar')
  }
}


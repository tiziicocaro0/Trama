import cliente from './cliente.js'

// 1.4: aceptar una invitación desde el enlace del mail.
const MENSAJES = {
  INVITACION_NO_ENCONTRADA:
    'No encontramos esta invitación. Revisá que el enlace del mail esté completo.',
  INVITACION_NO_DISPONIBLE:
    'Esta invitación venció o ya se usó. Pedile a quien te invitó que te mande otra.',
  DESTINATARIO_INCORRECTO:
    'Esta invitación es para otra cuenta. Ingresá con el email al que te llegó.',
  YA_ES_MIEMBRO: 'Ya formás parte de este acompañamiento.',
  ESPECIALIDAD_INCOMPATIBLE:
    'Alguna especialidad no corresponde al rol de la invitación.',
  ROL_SIN_ESPECIALIDAD: 'Con este rol no se declaran especialidades.',
}

function traducir(error, porDefecto) {
  if (!error.response)
    return new Error('No pudimos conectar con TRAMA. Revisá tu conexión.', {
      cause: error,
    })
  const codigo = error.response.data?.codigo
  const mensaje = new Error(MENSAJES[codigo] ?? porDefecto, { cause: error })
  mensaje.codigo = codigo
  return mensaje
}

export async function consultarInvitacion(token, signal) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    const { data } = await cliente.get(
      `/invitaciones/${encodeURIComponent(token)}`,
      { signal },
    )
    return data
  } catch (error) {
    if (signal?.aborted) throw error
    throw traducir(error, 'No pudimos abrir la invitación. Intentá nuevamente.')
  }
}

// 9.4: el rol lo fijó quien invita; acá solo se eligen las especialidades.
export async function aceptarInvitacion(token, especialidades = []) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    const { data } = await cliente.post(
      `/invitaciones/${encodeURIComponent(token)}/aceptar`,
      { especialidades },
    )
    return data
  } catch (error) {
    throw traducir(error, 'No pudimos aceptar la invitación. Intentá nuevamente.')
  }
}

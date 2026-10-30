import cliente from './cliente.js'

// 9.2: paquete institucional del usuario logueado. El pago es simulado.
const MENSAJES = {
  YA_ES_RESPONSABLE: 'Ya sos responsable de una institución.',
  PAQUETE_NO_ENCONTRADO: 'No encontramos ese paquete. Recargá la página.',
  EMAIL_NO_REGISTRADO: 'Ese email no está registrado en Trama: pedile que cree su cuenta primero.',
  YA_ASOCIADO: 'Ese profesional ya está asociado a la institución.',
  LICENCIA_NO_ENCONTRADA: 'Ese profesional ya no está asociado.',
  SIN_INSTITUCION: 'Todavía no contrataste un paquete.',
}

function verificarConexion() {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
}

function traducir(error, porDefecto) {
  const codigo = error.response?.data?.codigo
  return new Error(MENSAJES[codigo] ?? porDefecto, { cause: error })
}

export async function obtenerPaginaInstitucion(signal) {
  verificarConexion()
  const { data } = await cliente.get('/institucion', { signal })
  if (!Array.isArray(data?.paquetes))
    throw new Error('No pudimos verificar los paquetes.')
  return data
}

export async function contratarPaquete({ nombre, paqueteId }) {
  verificarConexion()
  try {
    const { data } = await cliente.post('/institucion', { nombre: nombre.trim(), paqueteId })
    return data
  } catch (error) {
    throw traducir(error, 'No pudimos contratar el paquete. Intentá de nuevo.')
  }
}

export async function asociarProfesional(email) {
  verificarConexion()
  try {
    const { data } = await cliente.post('/institucion/profesionales', {
      email: email.trim().toLowerCase(),
    })
    return data
  } catch (error) {
    throw traducir(error, 'No pudimos asociar al profesional. Intentá de nuevo.')
  }
}

export async function quitarProfesional(licenciaId) {
  verificarConexion()
  try {
    const { data } = await cliente.delete(
      `/institucion/profesionales/${encodeURIComponent(licenciaId)}`,
    )
    return data
  } catch (error) {
    throw traducir(error, 'No pudimos quitar al profesional. Intentá de nuevo.')
  }
}

// 9.3: el responsable cierra el aviso de cambio automático de paquete.
export async function cerrarAvisoCambioPaquete() {
  verificarConexion()
  try {
    const { data } = await cliente.put('/institucion/aviso')
    return data
  } catch (error) {
    throw traducir(error, 'No pudimos cerrar el aviso. Intentá de nuevo.')
  }
}

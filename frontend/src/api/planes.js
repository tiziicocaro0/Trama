import cliente from './cliente.js'

// 9.1: plan del usuario logueado. El pago es simulado: nunca viajan datos de tarjeta.
const PLANES = ['GRATUITO', 'MENSUAL', 'SEMESTRAL']

function verificarConexion() {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
}

function validarPlan(data) {
  if (
    typeof data?.esProfesional !== 'boolean' ||
    !PLANES.includes(data.plan) ||
    !Array.isArray(data.planes)
  ) {
    throw new Error('No pudimos verificar tu plan.')
  }
  return data
}

export async function obtenerMiPlan(signal) {
  verificarConexion()
  const { data } = await cliente.get('/suscripcion', { signal })
  return validarPlan(data)
}

export async function suscribirse(periodo) {
  verificarConexion()
  try {
    const { data } = await cliente.post('/suscripcion', { periodo })
    return validarPlan(data)
  } catch (error) {
    if (error.response?.data?.codigo === 'YA_SUSCRIPTO')
      throw new Error('Ya tenés una suscripción activa.', { cause: error })
    throw new Error('No pudimos activar el plan. Intentá de nuevo.', {
      cause: error,
    })
  }
}

export async function cancelarSuscripcion() {
  verificarConexion()
  try {
    const { data } = await cliente.delete('/suscripcion')
    return validarPlan(data)
  } catch (error) {
    throw new Error('No pudimos cancelar la suscripción. Intentá de nuevo.', {
      cause: error,
    })
  }
}

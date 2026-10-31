import cliente, { guardarToken } from './cliente.js'

export class ErrorRegistro extends Error {
  constructor(message, campos = {}) {
    super(message)
    this.name = 'ErrorRegistro'
    this.campos = campos
  }
}

export async function registrarUsuario({
  nombre,
  apellido,
  email,
  password,
  tipoCuenta,
  especialidades = [],
}) {
  if (!cliente.defaults.baseURL) {
    throw new ErrorRegistro(
      'Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.',
    )
  }

  let respuesta
  try {
    respuesta = await cliente.post('/auth/registro', {
      nombre,
      apellido,
      email,
      password,
      tipoCuenta,
      especialidades,
    })
  } catch (error) {
    const codigo = error.response?.data?.codigo
    if (error.response?.status === 400 && codigo === 'ESPECIALIDAD_REQUERIDA') {
      throw new ErrorRegistro('Revisá cómo vas a usar TRAMA.', {
        especialidades: 'Elegí al menos una especialidad.',
      })
    }
    if (error.response?.status === 409 && codigo === 'EMAIL_EN_USO') {
      throw new ErrorRegistro('Revisá el email para continuar.', {
        email: 'Este email ya está registrado.',
      })
    }
    if (error.response?.status === 400 && codigo === 'DATOS_INVALIDOS') {
      throw new ErrorRegistro(
        'Los datos enviados no son válidos. Volvé a revisarlos.',
      )
    }
    if (!error.response) {
      throw new ErrorRegistro(
        'No pudimos confirmar el registro. Revisá tu conexión antes de volver a intentarlo.',
      )
    }
    throw new ErrorRegistro(
      'No pudimos completar el registro. Intentá nuevamente en unos minutos.',
    )
  }

  // La cuenta queda esperando el código que llega por mail: todavía no hay sesión.
  if (respuesta.data?.verificacionPendiente !== true) {
    throw new ErrorRegistro(
      'La cuenta se creó, pero no pudimos confirmarlo. No vuelvas a registrarte con el mismo email: ingresá y te pedimos el código.',
    )
  }
}

const MENSAJES_CODIGO = {
  CODIGO_INVALIDO: 'El código no es correcto o ya venció. Revisalo o pedí uno nuevo.',
  CODIGO_BLOQUEADO: 'Superaste la cantidad de intentos. Pedí un código nuevo.',
  EMAIL_YA_VERIFICADO: 'Tu email ya está verificado. Ingresá con tu contraseña.',
}

// Registro: el código de 6 dígitos del mail activa la cuenta y abre la sesión.
export async function verificarEmail({ email, codigo }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  let respuesta
  try {
    respuesta = await cliente.post('/auth/verificar-email', {
      email: email.trim().toLowerCase(),
      codigo,
    })
  } catch (error) {
    if (!error.response)
      throw new Error('No pudimos conectar con TRAMA. Revisá tu conexión e intentá nuevamente.', { cause: error })
    const falla = new Error(
      MENSAJES_CODIGO[error.response.data?.codigo] ??
        'No pudimos verificar el código. Intentá nuevamente.',
      { cause: error },
    )
    falla.codigo = error.response.data?.codigo
    throw falla
  }
  const token = respuesta.data?.access_token
  if (typeof token !== 'string' || !token.trim())
    throw new Error('No recibimos una sesión válida. Ingresá con tu email y contraseña.')
  guardarToken(token)
}

export async function reenviarVerificacion(email) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    await cliente.post('/auth/reenviar-verificacion', {
      email: email.trim().toLowerCase(),
    })
  } catch (error) {
    throw new Error('No pudimos reenviar el código. Intentá nuevamente en unos minutos.', { cause: error })
  }
}

export async function iniciarSesion({ email, password }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  let respuesta
  try {
    respuesta = await cliente.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })
  } catch (error) {
    if (error.response?.status === 401)
      throw new Error('El email o la contraseña no son correctos.', { cause: error })
    if (
      error.response?.status === 403 &&
      error.response.data?.codigo === 'EMAIL_NO_VERIFICADO'
    ) {
      const falla = new Error('Todavía no confirmaste tu email. Ingresá el código que te mandamos.', { cause: error })
      falla.codigo = 'EMAIL_NO_VERIFICADO'
      throw falla
    }
    if (
      error.response?.status === 429 &&
      error.response.data?.codigo === 'CUENTA_BLOQUEADA'
    ) {
      throw new Error('Tu cuenta está bloqueada temporalmente. Intentá nuevamente en 15 minutos.', { cause: error })
    }
    if (!error.response)
      throw new Error('No pudimos conectar con TRAMA. Revisá tu conexión e intentá nuevamente.', { cause: error })
    throw new Error('No pudimos iniciar sesión. Intentá nuevamente en unos minutos.', { cause: error })
  }
  const token = respuesta.data?.access_token
  if (typeof token !== 'string' || !token.trim())
    throw new Error(
      'No recibimos una sesión válida. Intentá ingresar nuevamente.',
    )
  guardarToken(token)
}

export async function obtenerIdentidad() {
  const { data } = await cliente.get('/auth/yo')
  if (
    ['id', 'nombre', 'apellido', 'email'].some(
      (campo) => typeof data?.[campo] !== 'string' || !data[campo].trim(),
    )
  ) {
    throw new Error('No pudimos verificar tus datos de usuario.')
  }
  return {
    id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    // 9.4: para precargar cómo figura al sumarse a cada niño.
    tipoCuenta: data.tipoCuenta === 'PROFESIONAL' ? 'PROFESIONAL' : 'FAMILIA',
    especialidades: Array.isArray(data.especialidades)
      ? data.especialidades.filter((item) => typeof item?.especialidad === 'string')
      : [],
  }
}

export async function solicitarRecuperacion({ email }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    await cliente.post('/auth/recuperar', {
      email: email.trim().toLowerCase(),
    })
  } catch (error) {
    if (!error.response)
      throw new Error(
        'No pudimos conectar con TRAMA. Revisá tu conexión e intentá nuevamente.',
        { cause: error },
      )
    throw new Error(
      'No pudimos procesar el pedido. Intentá nuevamente en unos minutos.',
      { cause: error },
    )
  }
}

function errorDeCodigo(error, mensajeGenerico) {
  const codigo = error.response?.data?.codigo
  if (error.response?.status === 400 && codigo === 'CODIGO_INVALIDO')
    return new Error('El código no es válido o ya venció.', { cause: error })
  if (error.response?.status === 429 && codigo === 'CODIGO_BLOQUEADO')
    return new Error(
      'Superaste la cantidad de intentos. Pedí un código nuevo.',
      { cause: error },
    )
  if (error.response?.status === 400 && codigo === 'DATOS_INVALIDOS')
    return new Error('Revisá los datos ingresados.', { cause: error })
  if (!error.response)
    return new Error(
      'No pudimos conectar con TRAMA. Revisá tu conexión e intentá nuevamente.',
      { cause: error },
    )
  return new Error(mensajeGenerico, { cause: error })
}

export async function verificarCodigo({ email, codigo }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    await cliente.post('/auth/verificar-codigo', {
      email: email.trim().toLowerCase(),
      codigo,
    })
  } catch (error) {
    throw errorDeCodigo(
      error,
      'No pudimos verificar el código. Intentá nuevamente en unos minutos.',
    )
  }
}

export async function restablecerContrasena({ email, codigo, password }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA. Revisá VITE_API_URL.')
  try {
    await cliente.post('/auth/restablecer', {
      email: email.trim().toLowerCase(),
      codigo,
      password,
    })
  } catch (error) {
    throw errorDeCodigo(
      error,
      'No pudimos actualizar tu contraseña. Intentá nuevamente en unos minutos.',
    )
  }
}

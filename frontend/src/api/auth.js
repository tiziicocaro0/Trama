import cliente, { guardarToken } from './cliente.js'

export class ErrorRegistro extends Error {
  constructor(message, campos = {}) {
    super(message)
    this.name = 'ErrorRegistro'
    this.campos = campos
  }
}

export async function registrarUsuario({ nombre, apellido, email, password }) {
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
    })
  } catch (error) {
    const codigo = error.response?.data?.codigo
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

  const token = respuesta.data?.access_token
  if (typeof token !== 'string' || !token.trim()) {
    throw new ErrorRegistro(
      'La cuenta se creó, pero no recibimos la sesión. No vuelvas a registrarte con el mismo email.',
    )
  }
  guardarToken(token)
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
  }
}

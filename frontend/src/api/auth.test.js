import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cliente, { guardarToken, obtenerToken } from './cliente.js'
import { iniciarSesion, obtenerIdentidad, registrarUsuario } from './auth.js'

const datos = {
  nombre: 'Alma',
  apellido: 'Ejemplo',
  email: 'alma@trama.test',
  password: 'Prueba123!',
}
const baseOriginal = cliente.defaults.baseURL

beforeEach(() => {
  cliente.defaults.baseURL = 'http://localhost:4002/api'
  guardarToken(null)
})

describe('Contrato de login e identidad', () => {
  it('envía email y password a login y conserva el token devuelto', async () => {
    const post = vi
      .spyOn(cliente, 'post')
      .mockResolvedValue({ data: { access_token: 'jwt-ficticio' } })
    await iniciarSesion({ email: 'ALMA@trama.test', password: 'Prueba123!' })
    expect(post).toHaveBeenCalledExactlyOnceWith('/auth/login', {
      email: 'alma@trama.test',
      password: 'Prueba123!',
    })
    expect(obtenerToken()).toBe('jwt-ficticio')
  })

  it.each([
    [
      401,
      'CREDENCIALES_INVALIDAS',
      'El email o la contraseña no son correctos.',
    ],
    [
      429,
      'CUENTA_BLOQUEADA',
      'Tu cuenta está bloqueada temporalmente. Intentá nuevamente en 15 minutos.',
    ],
    [
      500,
      'ERROR_INTERNO',
      'No pudimos iniciar sesión. Intentá nuevamente en unos minutos.',
    ],
  ])(
    'muestra un mensaje claro ante HTTP %s en login',
    async (status, codigo, mensaje) => {
      vi.spyOn(cliente, 'post').mockRejectedValue({
        response: { status, data: { codigo } },
      })
      await expect(iniciarSesion(datos)).rejects.toThrow(mensaje)
      expect(obtenerToken()).toBeNull()
    },
  )

  it('muestra un error de conexión al ingresar sin respuesta del servidor', async () => {
    vi.spyOn(cliente, 'post').mockRejectedValue(new Error('Red simulada'))
    await expect(iniciarSesion(datos)).rejects.toThrow(
      'No pudimos conectar con TRAMA.',
    )
  })

  it('rechaza una respuesta de login sin token', async () => {
    vi.spyOn(cliente, 'post').mockResolvedValue({ data: {} })
    await expect(iniciarSesion(datos)).rejects.toThrow(
      'No recibimos una sesión válida.',
    )
  })

  it('consulta el perfil real sin deducirlo del JWT', async () => {
    const identidad = {
      id: 'id-ficticio',
      nombre: 'Alma',
      apellido: 'Ejemplo',
      email: datos.email,
    }
    const get = vi.spyOn(cliente, 'get').mockResolvedValue({ data: identidad })
    expect(await obtenerIdentidad()).toEqual(identidad)
    expect(get).toHaveBeenCalledExactlyOnceWith('/auth/yo')
  })

  it('rechaza una respuesta de identidad incompleta', async () => {
    vi.spyOn(cliente, 'get').mockResolvedValue({ data: { nombre: 'Alma' } })
    await expect(obtenerIdentidad()).rejects.toThrow(
      'No pudimos verificar tus datos de usuario.',
    )
  })
})

afterEach(() => {
  cliente.defaults.baseURL = baseOriginal
  guardarToken(null)
  vi.restoreAllMocks()
})

describe('API real de registro con transporte simulado', () => {
  it('envía únicamente los campos del DTO a la ruta real y guarda el JWT solo en memoria', async () => {
    const almacenar = vi.spyOn(Storage.prototype, 'setItem')
    const post = vi.spyOn(cliente, 'post').mockResolvedValue({
      status: 201,
      data: { access_token: 'jwt-ficticio' },
    })
    await registrarUsuario({ ...datos, rol: 'TUTOR' })
    expect(post).toHaveBeenCalledExactlyOnceWith('/auth/registro', datos)
    expect(obtenerToken()).toBe('jwt-ficticio')
    expect(almacenar).not.toHaveBeenCalled()
  })

  it.each([
    [409, 'EMAIL_EN_USO', 'Revisá el email para continuar.'],
    [
      400,
      'DATOS_INVALIDOS',
      'Los datos enviados no son válidos. Volvé a revisarlos.',
    ],
    [
      500,
      'ERROR_INTERNO',
      'No pudimos completar el registro. Intentá nuevamente en unos minutos.',
    ],
    [
      403,
      'ACCESO_DENEGADO',
      'No pudimos completar el registro. Intentá nuevamente en unos minutos.',
    ],
  ])(
    'maneja el rechazo HTTP %s sin crear una sesión',
    async (status, codigo, mensaje) => {
      vi.spyOn(cliente, 'post').mockRejectedValue({
        response: { status, data: { codigo, mensaje: 'Detalle del servidor' } },
      })
      await expect(registrarUsuario(datos)).rejects.toThrow(mensaje)
      expect(obtenerToken()).toBeNull()
    },
  )

  it('asocia EMAIL_EN_USO con el campo email', async () => {
    vi.spyOn(cliente, 'post').mockRejectedValue({
      response: { status: 409, data: { codigo: 'EMAIL_EN_USO' } },
    })
    await expect(registrarUsuario(datos)).rejects.toMatchObject({
      campos: { email: 'Este email ya está registrado.' },
    })
  })

  it('no reintenta automáticamente ante un fallo de red', async () => {
    const post = vi
      .spyOn(cliente, 'post')
      .mockRejectedValue(new Error('Fallo simulado'))
    await expect(registrarUsuario(datos)).rejects.toThrow(
      'No pudimos confirmar el registro.',
    )
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('no envía una solicitud a una URL implícita si falta la configuración', async () => {
    cliente.defaults.baseURL = undefined
    const post = vi.spyOn(cliente, 'post')
    await expect(registrarUsuario(datos)).rejects.toThrow('VITE_API_URL')
    expect(post).not.toHaveBeenCalled()
  })

  it('no guarda una sesión si la respuesta no incluye el token del contrato', async () => {
    vi.spyOn(cliente, 'post').mockResolvedValue({ status: 201, data: {} })
    await expect(registrarUsuario(datos)).rejects.toThrow(
      'La cuenta se creó, pero no recibimos la sesión.',
    )
    expect(obtenerToken()).toBeNull()
  })

  it('adjunta Bearer a solicitudes autenticadas, sin adjuntarlo al registro público', async () => {
    guardarToken('jwt-ficticio')
    const adapter = vi.fn(async (config) => ({
      status: 200,
      statusText: 'OK',
      data: {},
      headers: {},
      config,
    }))
    await cliente.get('/auth/yo', { adapter })
    expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBe(
      'Bearer jwt-ficticio',
    )
    await cliente.post('/auth/registro', datos, { adapter })
    expect(
      adapter.mock.calls[1][0].headers.get('Authorization'),
    ).toBeUndefined()
  })
})

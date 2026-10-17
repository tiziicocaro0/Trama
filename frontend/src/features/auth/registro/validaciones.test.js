import { describe, expect, it } from 'vitest'
import { validarRegistro } from './validaciones.js'

const datos = {
  nombre: 'Alma',
  apellido: 'Ejemplo',
  email: 'alma@trama.test',
  password: 'Prueba123!',
}

describe('Validaciones del contrato de registro', () => {
  it('acepta los datos completos y no obliga a elegir un rol', () => {
    expect(validarRegistro(datos)).toEqual({})
  })

  it.each(['nombre', 'apellido', 'email', 'password'])(
    'rechaza %s vacío o con espacios',
    (campo) => {
      expect(validarRegistro({ ...datos, [campo]: '   ' })[campo]).toBeTruthy()
    },
  )

  it.each(['nombre', 'apellido'])('limita %s a 80 caracteres', (campo) => {
    expect(validarRegistro({ ...datos, [campo]: 'a'.repeat(80) })).toEqual({})
    expect(
      validarRegistro({ ...datos, [campo]: 'a'.repeat(81) })[campo],
    ).toBeTruthy()
  })

  it.each([
    'sin-arroba',
    'alma@',
    '@trama.test',
    'alma@@trama.test',
    'alma ejemplo@trama.test',
  ])('rechaza email inválido: %s', (email) => {
    expect(validarRegistro({ ...datos, email }).email).toBeTruthy()
  })

  it('respeta el límite de 254 caracteres del email', () => {
    const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`
    expect(validarRegistro({ ...datos, email })).toEqual({})
    expect(validarRegistro({ ...datos, email: `${email}b` }).email).toBeTruthy()
  })

  it.each(['Ab1!xyz', 'prueba123!', 'Pruebaaaa!', 'Prueba123', 'Prueba123!\n'])(
    'rechaza una contraseña que incumple el contrato: %s',
    (password) => {
      expect(validarRegistro({ ...datos, password }).password).toBeTruthy()
    },
  )

  it('no inventa un máximo de contraseña ni restringe los caracteres especiales a ASCII', () => {
    expect(
      validarRegistro({ ...datos, password: `A1${'ñ'.repeat(80)}` }),
    ).toEqual({})
  })

  it('valida solo los campos de la etapa visible antes de la confirmación', () => {
    expect(validarRegistro({ ...datos, password: '' }, 0)).toEqual({})
    expect(validarRegistro({ ...datos, email: '' }, 1)).toEqual({})
    expect(validarRegistro({ ...datos, email: '' }, 2).email).toBeTruthy()
  })
})

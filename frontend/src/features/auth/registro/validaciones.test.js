import { describe, expect, it } from 'vitest'
import { validarRegistro } from './validaciones.js'

const datos = {
  nombre: 'Alma',
  apellido: 'Ejemplo',
  email: 'alma@trama.test',
  password: 'Prueba123!',
  tipoCuenta: 'FAMILIA',
  especialidades: [],
}

describe('Validaciones del contrato de registro', () => {
  it('acepta los datos completos de una familia', () => {
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
    expect(validarRegistro({ ...datos, password: '' }, 1)).toEqual({})
    expect(validarRegistro({ ...datos, email: '' }, 2)).toEqual({})
    expect(validarRegistro({ ...datos, tipoCuenta: '' }, 2)).toEqual({})
    expect(validarRegistro({ ...datos, email: '' }, 3).email).toBeTruthy()
  })

  it('9.4: pide el tipo de cuenta, el área y al menos una especialidad al profesional', () => {
    expect(validarRegistro({ ...datos, tipoCuenta: '' }, 1).tipoCuenta).toBeTruthy()
    const profesional = { ...datos, tipoCuenta: 'PROFESIONAL', area: '' }
    expect(validarRegistro(profesional, 1).area).toBeTruthy()
    const salud = { ...profesional, area: 'SALUD' }
    expect(validarRegistro(salud, 1).especialidades).toBeTruthy()
    const psicologia = { especialidad: 'PSICOLOGIA', aclaracion: '' }
    expect(validarRegistro({ ...salud, especialidades: [psicologia] }, 1)).toEqual({})
    expect(
      validarRegistro({ ...salud, especialidades: Array(11).fill(psicologia) }, 1)
        .especialidades,
    ).toBeTruthy()
    const otra = { especialidad: 'OTRA_SALUD', aclaracion: '  ' }
    expect(validarRegistro({ ...salud, especialidades: [otra] }, 1).especialidades).toBe(
      'Contanos qué hacés en «Otra».',
    )
  })

  it('el último paso pide los 6 dígitos del código', () => {
    expect(validarRegistro({ ...datos, codigo: '12345' }, 4).codigo).toBeTruthy()
    expect(validarRegistro({ ...datos, codigo: '123456' }, 4)).toEqual({})
  })
})

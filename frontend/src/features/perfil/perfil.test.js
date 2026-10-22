import { describe, expect, it } from 'vitest'
import { calcularEdad, seccionesPerfil } from './perfil.js'
import { obtenerAportesEjemplo } from './perfil.mock.js'

describe('Edad por fecha de calendario', () => {
  it.each([
    ['2017-10-18', new Date(2026, 9, 17), 8],
    ['2017-10-17', new Date(2026, 9, 17), 9],
    ['2017-10-16', new Date(2026, 9, 17), 9],
    ['2026-10-17', new Date(2026, 9, 17), 0],
    ['2025-10-17', new Date(2026, 9, 17), 1],
    ['2020-02-29', new Date(2024, 1, 28), 3],
    ['2020-02-29', new Date(2024, 1, 29), 4],
    ['2017-12-31', new Date(2026, 0, 1), 8],
  ])('calcula %s sin adelantar el cumpleaños', (fecha, hoy, esperado) => {
    expect(calcularEdad(fecha, hoy)).toBe(esperado)
  })

  it.each([
    null,
    undefined,
    '',
    'inválida',
    '2026-02-30',
    '2026-13-01',
    '2027-01-01',
  ])('rechaza fecha inválida o futura: %s', (fecha) => {
    expect(calcularEdad(fecha, new Date(2026, 9, 17))).toBeNull()
  })
})

describe('Secciones y ejemplos del perfil', () => {
  it('respeta el orden de RF-10', () => {
    expect(seccionesPerfil.map((seccion) => seccion.titulo)).toEqual([
      'Fortalezas',
      'Intereses',
      'Comunicación',
      'Perfil sensorial',
      'Estrategias',
      'Rutinas',
    ])
  })
  it('devuelve ejemplos del más reciente al más antiguo sin compartir objetos mutables', () => {
    const aportes = obtenerAportesEjemplo('FORTALEZA')
    expect(aportes).toHaveLength(4)
    expect(aportes[0].creadoEn > aportes[3].creadoEn).toBe(true)
    aportes[0].titulo = 'Modificado'
    expect(obtenerAportesEjemplo('FORTALEZA')[0].titulo).toBe('Creatividad')
    expect(obtenerAportesEjemplo('SENSORIAL')).toEqual([])
  })
})

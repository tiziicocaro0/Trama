import { describe, expect, it } from 'vitest'
import { formatearFechaCalendario, formatearFechaHora, hoyIso } from './fechas.js'

describe('Fechas de calendario y notas', () => {
  it('muestra la fecha de nacimiento sin desplazarla por UTC', () => {
    expect(formatearFechaCalendario('2018-05-12')).toBe('12/05/2018')
    expect(formatearFechaCalendario('2024-02-29')).toBe('29/02/2024')
  })
  it.each([null, '', 'incorrecta', '2026-02-30', '2026-13-01'])(
    'rechaza una fecha de calendario inválida: %s',
    (valor) => {
      expect(formatearFechaCalendario(valor)).toBeNull()
    },
  )
  it('convierte el instante del servidor a la fecha y hora de la zona de lectura', () => {
    expect(
      formatearFechaHora(
        '2026-10-18T01:30:45Z',
        'America/Argentina/Buenos_Aires',
      ),
    ).toBe('17/10/2026, 22:30:45')
    expect(formatearFechaHora('2026-10-18T01:30:45Z', 'UTC')).toBe(
      '18/10/2026, 01:30:45',
    )
  })
  it.each([null, '', 'incorrecta'])(
    'no inventa una hora si no fue recibida: %s',
    (valor) => {
      expect(formatearFechaHora(valor)).toBeNull()
    },
  )
})

describe('Fecha de hoy en AAAA-MM-DD', () => {
  it('arma la fecha local con ceros a la izquierda', () => {
    expect(hoyIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

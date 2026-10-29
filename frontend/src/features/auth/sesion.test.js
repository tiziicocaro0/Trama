import { describe, expect, it } from 'vitest'
import { vencimientoToken } from './sesion.js'

describe('Vencimiento del JWT (sin usar claims como identidad)', () => {
  it('lee exp en segundos con base64url sin padding', () => {
    const token = `cabecera.${btoa(JSON.stringify({ exp: 2000000000 })).replace(/=+$/, '')}.firma`
    expect(vencimientoToken(token)).toBe(2000000000000)
  })
  it.each(['', 'invalido', 'a.b.c', 'a.e30.c'])(
    'rechaza una estructura inválida: %s',
    (token) => {
      expect(vencimientoToken(token)).toBe(0)
    },
  )
})

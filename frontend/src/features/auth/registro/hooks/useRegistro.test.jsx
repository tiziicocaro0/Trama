import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { registrarUsuario } from '../../../../api/auth.js'
import useRegistro from './useRegistro.js'

vi.mock('../../../../hooks/useAuth.js', () => ({
  default: () => ({ confirmarSesion: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../../../../api/auth.js', () => ({ registrarUsuario: vi.fn() }))

describe('Estado del registro', () => {
  it('elimina la contraseña del estado después del éxito y conserva los datos de revisión', async () => {
    vi.mocked(registrarUsuario).mockResolvedValue(undefined)
    const { result } = renderHook(useRegistro)
    act(() => {
      for (const [name, value] of Object.entries({
        nombre: 'Alma',
        apellido: 'Ejemplo',
        email: 'alma@trama.test',
        password: 'Prueba123!',
        tipoCuenta: 'FAMILIA',
      })) {
        result.current.cambiar({ target: { name, value } })
      }
    })
    for (let paso = 0; paso < 4; paso += 1) {
      await act(async () => {
        await result.current.avanzar({ preventDefault: vi.fn() })
      })
    }
    expect(result.current.exito).toBe(true)
    expect(result.current.valores.password).toBe('')
    expect(result.current.valores.nombre).toBe('Alma')
  })
})

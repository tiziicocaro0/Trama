import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { registrarUsuario, verificarEmail } from '../../../../api/auth.js'
import useRegistro from './useRegistro.js'

vi.mock('../../../../hooks/useAuth.js', () => ({
  default: () => ({ confirmarSesion: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../../../../api/auth.js', () => ({
  registrarUsuario: vi.fn(),
  verificarEmail: vi.fn(),
  reenviarVerificacion: vi.fn(),
}))

describe('Estado del registro', () => {
  it('elimina la contraseña del estado después del éxito y conserva los datos de revisión', async () => {
    vi.mocked(registrarUsuario).mockResolvedValue(undefined)
    vi.mocked(verificarEmail).mockResolvedValue(undefined)
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
    // La cuenta se creó: la contraseña ya no queda en memoria y falta el código del mail
    expect(result.current.valores.password).toBe('')
    expect(result.current.exito).toBe(false)
    act(() => {
      result.current.cambiar({ target: { name: 'codigo', value: '123456' } })
    })
    await act(async () => {
      await result.current.avanzar({ preventDefault: vi.fn() })
    })
    expect(result.current.exito).toBe(true)
    expect(result.current.valores.password).toBe('')
    expect(result.current.valores.nombre).toBe('Alma')
  })
})

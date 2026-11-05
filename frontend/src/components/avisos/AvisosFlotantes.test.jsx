import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { avisar, avisarError } from './avisosFlotantes.js'

afterEach(() => vi.useRealTimers())

// AvisosFlotantes ya está montado para todos los tests (setupTests.js).
describe('Avisos flotantes', () => {
  it('muestra el aviso y se cierra con la X', async () => {
    const user = userEvent.setup()
    act(() => {
      avisar('Guardamos la foto.')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Guardamos la foto.')
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText('Guardamos la foto.')).not.toBeInTheDocument()
  })

  it('los errores se anuncian como alerta y se van solos', () => {
    vi.useFakeTimers()
    act(() => {
      avisarError('No pudimos guardar.')
    })
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar.')
    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('no acumula más de cuatro avisos', () => {
    act(() => {
      for (let i = 1; i <= 6; i += 1) avisar(`Aviso ${i}`)
    })
    expect(screen.getAllByRole('status')).toHaveLength(4)
    expect(screen.queryByText('Aviso 1')).not.toBeInTheDocument()
  })
})

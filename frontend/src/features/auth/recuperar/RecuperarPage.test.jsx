import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarRecuperacion } from '../../../api/auth.js'
import RecuperarPage from './RecuperarPage.jsx'

vi.mock('../../../api/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  solicitarRecuperacion: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(solicitarRecuperacion).mockReset()
})

function preparar() {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RecuperarPage />
    </MemoryRouter>,
  )
  return user
}

describe('Recuperar contraseña', () => {
  it('muestra el formulario con el email y el enlace a login', () => {
    preparar()
    expect(
      screen.getByRole('heading', { name: 'Recuperar contraseña' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ingresá acá' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('valida el email antes de enviar', async () => {
    const user = preparar()
    await user.click(
      screen.getByRole('button', { name: 'Enviar instrucciones' }),
    )
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Ingresá tu email.',
    )
    expect(solicitarRecuperacion).not.toHaveBeenCalled()
  })

  it('muestra el mismo mensaje de éxito exista o no el email', async () => {
    vi.mocked(solicitarRecuperacion).mockResolvedValue(undefined)
    const user = preparar()
    await user.type(screen.getByLabelText('Email'), 'alma@trama.test')
    await user.click(
      screen.getByRole('button', { name: 'Enviar instrucciones' }),
    )
    expect(solicitarRecuperacion).toHaveBeenCalledExactlyOnceWith({
      email: 'alma@trama.test',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si el email está registrado',
    )
  })

  it('muestra un error cuando el pedido falla', async () => {
    vi.mocked(solicitarRecuperacion).mockRejectedValue(
      new Error('No pudimos conectar con TRAMA.'),
    )
    const user = preparar()
    await user.type(screen.getByLabelText('Email'), 'alma@trama.test')
    await user.click(
      screen.getByRole('button', { name: 'Enviar instrucciones' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectar con TRAMA.',
    )
  })
})

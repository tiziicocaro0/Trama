import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { restablecerContrasena } from '../../../api/auth.js'
import RestablecerPage from './RestablecerPage.jsx'

vi.mock('../../../api/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  restablecerContrasena: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(restablecerContrasena).mockReset()
})

function preparar(ruta = '/restablecer?token=token-ficticio') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/restablecer" element={<RestablecerPage />} />
      </Routes>
    </MemoryRouter>,
  )
  return user
}

async function completarPassword(user, password = 'Prueba123!') {
  await user.type(screen.getByLabelText('Contraseña nueva'), password)
  await user.type(screen.getByLabelText('Repetí la contraseña'), password)
  await user.click(
    screen.getByRole('button', { name: 'Guardar nueva contraseña' }),
  )
}

describe('Restablecer contraseña', () => {
  it('pide un nuevo pedido de recuperación si falta el token en el enlace', () => {
    preparar('/restablecer')
    expect(
      screen.getByRole('heading', { name: 'Enlace incompleto' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Pedir recuperación' }),
    ).toHaveAttribute('href', '/recuperar')
  })

  it('valida que la contraseña cumpla los requisitos de seguridad', async () => {
    const user = preparar()
    await completarPassword(user, 'debil')
    expect(
      screen.getByLabelText('Contraseña nueva'),
    ).toHaveAccessibleDescription(
      'La contraseña debe cumplir todos los requisitos de seguridad.',
    )
    expect(restablecerContrasena).not.toHaveBeenCalled()
  })

  it('valida que ambas contraseñas coincidan', async () => {
    const user = preparar()
    await user.type(screen.getByLabelText('Contraseña nueva'), 'Prueba123!')
    await user.type(screen.getByLabelText('Repetí la contraseña'), 'Otra123!')
    await user.click(
      screen.getByRole('button', { name: 'Guardar nueva contraseña' }),
    )
    expect(
      screen.getByLabelText('Repetí la contraseña'),
    ).toHaveAccessibleDescription('Las contraseñas no coinciden.')
    expect(restablecerContrasena).not.toHaveBeenCalled()
  })

  it('envia el token del enlace junto a la nueva contraseña', async () => {
    vi.mocked(restablecerContrasena).mockResolvedValue(undefined)
    const user = preparar()
    await completarPassword(user)
    expect(restablecerContrasena).toHaveBeenCalledExactlyOnceWith({
      token: 'token-ficticio',
      password: 'Prueba123!',
    })
    expect(
      await screen.findByRole('heading', { name: 'Contraseña actualizada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ir al inicio de sesión' }),
    ).toHaveAttribute('href', '/login')
  })

  it('muestra el error del servidor si el token es invalido o venció', async () => {
    vi.mocked(restablecerContrasena).mockRejectedValue(
      new Error('El enlace no es válido o ya venció. Volvé a pedir la recuperación.'),
    )
    const user = preparar()
    await completarPassword(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El enlace no es válido o ya venció.',
    )
  })
})

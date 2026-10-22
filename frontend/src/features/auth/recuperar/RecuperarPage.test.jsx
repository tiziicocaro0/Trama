import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  restablecerContrasena,
  solicitarRecuperacion,
  verificarCodigo,
} from '../../../api/auth.js'
import RecuperarPage from './RecuperarPage.jsx'

vi.mock('../../../api/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  solicitarRecuperacion: vi.fn(),
  verificarCodigo: vi.fn(),
  restablecerContrasena: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(solicitarRecuperacion).mockReset().mockResolvedValue(undefined)
  vi.mocked(verificarCodigo).mockReset().mockResolvedValue(undefined)
  vi.mocked(restablecerContrasena).mockReset().mockResolvedValue(undefined)
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

async function pasarEmail(user, email = 'alma@trama.test') {
  await user.type(screen.getByLabelText('Email'), email)
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  await screen.findByRole('heading', { name: 'Ingresá el código' })
}

async function pasarCodigo(user, codigo = '123456') {
  await user.type(screen.getByLabelText('Código de 6 dígitos'), codigo)
  await user.click(screen.getByRole('button', { name: 'Verificar código' }))
  await screen.findByRole('heading', { name: 'Elegí tu nueva contraseña' })
}

describe('Recuperar contraseña con código', () => {
  it('arranca pidiendo el email, con las tres etapas y el enlace al login', () => {
    preparar()
    expect(
      screen.getByRole('heading', { name: 'Recuperar contraseña' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Etapas de la recuperación' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ingresá acá' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('valida el email antes de pedir el código', async () => {
    const user = preparar()
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Ingresá tu email.',
    )
    expect(solicitarRecuperacion).not.toHaveBeenCalled()
  })

  it('completa el flujo email, código y nueva contraseña', async () => {
    const user = preparar()
    await pasarEmail(user)
    expect(solicitarRecuperacion).toHaveBeenCalledExactlyOnceWith({
      email: 'alma@trama.test',
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Si el email está registrado',
    )

    await pasarCodigo(user)
    expect(verificarCodigo).toHaveBeenCalledExactlyOnceWith({
      email: 'alma@trama.test',
      codigo: '123456',
    })

    await user.type(screen.getByLabelText('Contraseña nueva'), 'Prueba123!')
    await user.type(screen.getByLabelText('Repetí la contraseña'), 'Prueba123!')
    await user.click(
      screen.getByRole('button', { name: 'Guardar nueva contraseña' }),
    )
    expect(restablecerContrasena).toHaveBeenCalledExactlyOnceWith({
      email: 'alma@trama.test',
      codigo: '123456',
      password: 'Prueba123!',
    })
    expect(
      await screen.findByRole('heading', { name: 'Contraseña actualizada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ir al inicio de sesión' }),
    ).toHaveAttribute('href', '/login')
  })

  it('el campo del código solo acepta 6 números', async () => {
    const user = preparar()
    await pasarEmail(user)
    await user.type(screen.getByLabelText('Código de 6 dígitos'), 'ab12c3')
    expect(screen.getByLabelText('Código de 6 dígitos')).toHaveValue('123')
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    expect(
      screen.getByLabelText('Código de 6 dígitos'),
    ).toHaveAccessibleDescription('Ingresá los 6 dígitos del código.')
    expect(verificarCodigo).not.toHaveBeenCalled()
  })

  it('muestra el error si el código es incorrecto y no avanza', async () => {
    vi.mocked(verificarCodigo).mockRejectedValue(
      new Error('El código no es válido o ya venció.'),
    )
    const user = preparar()
    await pasarEmail(user)
    await user.type(screen.getByLabelText('Código de 6 dígitos'), '000000')
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El código no es válido o ya venció.',
    )
    expect(
      screen.getByRole('heading', { name: 'Ingresá el código' }),
    ).toBeInTheDocument()
  })

  it('no deja reenviar el código hasta que pase el minuto', async () => {
    const user = preparar()
    await pasarEmail(user)
    expect(
      screen.getByRole('button', { name: /Reenviar código en \d+ s/ }),
    ).toBeDisabled()
  })

  it('valida que las contraseñas coincidan', async () => {
    const user = preparar()
    await pasarEmail(user)
    await pasarCodigo(user)
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
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorRegistro, registrarUsuario } from '../../../api/auth.js'
import RegistroPage from './RegistroPage.jsx'

vi.mock('../../../hooks/useAuth.js', () => ({
  default: () => ({ confirmarSesion: vi.fn().mockResolvedValue(undefined) }),
}))

vi.mock('../../../api/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  registrarUsuario: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(registrarUsuario).mockReset()
})

function preparar() {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RegistroPage />
    </MemoryRouter>,
  )
  return user
}

async function completarDatos(user, email = 'ALMA@trama.test') {
  await user.type(screen.getByLabelText('Nombre'), 'Alma')
  await user.type(screen.getByLabelText('Apellido'), 'Ejemplo')
  await user.type(screen.getByLabelText('Email'), email)
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
}

async function llegarAConfirmacion(user) {
  await completarDatos(user)
  await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
}

describe('Crear cuenta', () => {
  it('muestra el formulario y las tres etapas acordadas', () => {
    preparar()
    expect(
      screen.getByRole('heading', { name: 'Crear tu cuenta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Tus datos' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Datos').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('Seguridad')).toBeInTheDocument()
    expect(screen.getByText('Confirmación')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ingresá acá' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
  })

  it('muestra errores asociados y enfoca el primer campo inválido', async () => {
    const user = preparar()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription(
      'Ingresá tu nombre.',
    )
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(registrarUsuario).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('Nombre'), 'Alma')
    await user.type(screen.getByLabelText('Apellido'), 'Ejemplo')
    await user.type(screen.getByLabelText('Email'), 'email-incorrecto')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Ingresá un email válido.',
    )
  })

  it('valida contraseña y conserva los datos al avanzar y volver sin hacer solicitudes', async () => {
    const user = preparar()
    await completarDatos(user)
    await user.type(screen.getByLabelText('Contraseña'), 'corta')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(
      screen.getByText(
        'La contraseña debe cumplir todos los requisitos de seguridad.',
      ),
    ).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Contraseña'))
    await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByLabelText('Nombre')).toHaveValue('Alma')
    expect(screen.getByLabelText('Email')).toHaveValue('ALMA@trama.test')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Prueba123!')
    expect(registrarUsuario).not.toHaveBeenCalled()
  })

  it('revisa los datos sin mostrar la contraseña y envía una única solicitud al finalizar', async () => {
    vi.mocked(registrarUsuario).mockResolvedValue(undefined)
    const user = preparar()
    await llegarAConfirmacion(user)
    expect(
      screen.getByRole('heading', { name: 'Confirmá tus datos' }),
    ).toHaveFocus()
    expect(screen.getByText('Alma')).toBeInTheDocument()
    expect(screen.queryByText('Prueba123!')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    expect(registrarUsuario).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(registrarUsuario).toHaveBeenCalledExactlyOnceWith({
      nombre: 'Alma',
      apellido: 'Ejemplo',
      email: 'alma@trama.test',
      password: 'Prueba123!',
    })
    expect(
      await screen.findByRole('heading', { name: 'Cuenta creada' }),
    ).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu cuenta se creó correctamente.',
    )
    expect(
      screen.queryByRole('button', { name: 'Crear cuenta' }),
    ).not.toBeInTheDocument()
  })

  it('bloquea envíos duplicados incluso si se disparan dos eventos submit seguidos', async () => {
    let resolver
    vi.mocked(registrarUsuario).mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )
    const user = preparar()
    await llegarAConfirmacion(user)
    const form = screen.getByRole('form', { name: 'Confirmá tus datos' })
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(
      screen.getByRole('button', { name: 'Creando cuenta…' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled()
    expect(registrarUsuario).toHaveBeenCalledTimes(1)
    resolver()
    expect(
      await screen.findByRole('heading', { name: 'Cuenta creada' }),
    ).toBeInTheDocument()
  })

  it('muestra el email duplicado en su campo y conserva todos los datos para corregirlos', async () => {
    vi.mocked(registrarUsuario).mockRejectedValue(
      new ErrorRegistro('Revisá el email para continuar.', {
        email: 'Este email ya está registrado.',
      }),
    )
    const user = preparar()
    await llegarAConfirmacion(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus())
    expect(screen.getByLabelText('Email')).toHaveValue('ALMA@trama.test')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Este email ya está registrado.',
    )
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'otro@trama.test')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Prueba123!')
  })

  it('permite revisar y reintentar sin borrar los datos ante otros errores de la API', async () => {
    vi.mocked(registrarUsuario).mockRejectedValue(
      new ErrorRegistro('No pudimos completar el registro.'),
    )
    const user = preparar()
    await llegarAConfirmacion(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos completar el registro.',
    )
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Prueba123!')
  })
})

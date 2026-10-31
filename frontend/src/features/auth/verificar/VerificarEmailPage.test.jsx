import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../../routes/AppRoutes.jsx'
import AuthContext from '../AuthContext.js'
import cliente from '../../../api/cliente.js'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() },
  guardarToken: vi.fn(),
  obtenerToken: vi.fn(),
  alRechazarSesion: vi.fn(),
}))

function abrir(sesion) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={{ usuario: null, estado: 'anonimo', ...sesion }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Activar la cuenta con el código del mail', () => {
  it('desde el login lleva a ingresar el código y activa la cuenta', async () => {
    const user = userEvent.setup()
    const confirmarSesion = vi.fn().mockResolvedValue({})
    const ingresar = vi.fn().mockRejectedValue(
      Object.assign(new Error('Todavía no confirmaste tu email. Ingresá el código que te mandamos.'), {
        codigo: 'EMAIL_NO_VERIFICADO',
      }),
    )
    cliente.post.mockResolvedValue({ data: { access_token: 'jwt-ficticio' } })
    abrir({ ingresar, confirmarSesion })

    await user.type(screen.getByLabelText('Email'), 'Alma@trama.test')
    await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    await user.click(await screen.findByRole('link', { name: 'Ingresar el código' }))

    expect(await screen.findByRole('heading', { name: 'Activá tu cuenta' })).toBeVisible()
    expect(screen.getByLabelText('Email')).toHaveValue('alma@trama.test')
    await user.type(screen.getByLabelText('Código de 6 dígitos'), '654321')
    await user.click(screen.getByRole('button', { name: 'Activar cuenta' }))

    expect(cliente.post).toHaveBeenCalledWith('/auth/verificar-email', {
      email: 'alma@trama.test',
      codigo: '654321',
    })
    expect(confirmarSesion).toHaveBeenCalled()
  })

  it('reenvía el código y espera un minuto para el próximo', async () => {
    const user = userEvent.setup()
    cliente.post.mockResolvedValue({ data: {} })
    render(
      <MemoryRouter initialEntries={[{ pathname: '/verificar-email', state: { email: 'alma@trama.test' } }]}>
        <AuthContext.Provider value={{ usuario: null, estado: 'anonimo' }}>
          <AppRoutes />
        </AuthContext.Provider>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))
    expect(cliente.post).toHaveBeenCalledWith('/auth/reenviar-verificacion', {
      email: 'alma@trama.test',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('te mandamos un código nuevo')
    expect(screen.getByRole('button', { name: /Reenviar código en 60 s/ })).toBeDisabled()
  })
})

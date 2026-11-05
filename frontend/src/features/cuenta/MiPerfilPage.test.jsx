import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    put: vi.fn(),
  },
}))

const profesional = {
  id: 'usuario-ficticio',
  nombre: 'Pía',
  apellido: 'Ejemplo',
  email: 'pia@trama.test',
  tipoCuenta: 'PROFESIONAL',
  especialidades: [{ especialidad: 'PSICOLOGIA', aclaracion: null }],
  matricula: 'MN 45.123',
}

function abrir(usuario, confirmarSesion = vi.fn().mockResolvedValue(usuario)) {
  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <AuthContext.Provider value={{ usuario, estado: 'autenticado', confirmarSesion }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return confirmarSesion
}

beforeEach(() => {
  cliente.get.mockReset().mockResolvedValue({ data: [] })
  cliente.put.mockReset()
})

describe('Mi perfil', () => {
  it('muestra los datos de la cuenta', () => {
    abrir(profesional)
    expect(screen.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('pia@trama.test')).toBeInTheDocument()
    expect(screen.getByText('Soy profesional')).toBeInTheDocument()
    expect(screen.getByText('Psicología')).toBeInTheDocument()
  })

  it('el profesional cambia su matrícula y se aclara que TRAMA no la verifica', async () => {
    cliente.put.mockResolvedValue({ data: { ...profesional, matricula: 'MP 778' } })
    const confirmarSesion = abrir(profesional)
    expect(screen.getByText(/TRAMA no verifica que sea válida/)).toBeInTheDocument()
    const campo = screen.getByRole('textbox', { name: 'Matrícula' })
    expect(campo).toHaveValue('MN 45.123')
    expect(campo).toHaveAttribute('maxLength', '40')
    await userEvent.clear(campo)
    await userEvent.type(campo, ' MP 778 ')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(cliente.put).toHaveBeenCalledExactlyOnceWith('/usuarios/yo/matricula', {
      matricula: 'MP 778',
    })
    expect(await screen.findByText('Guardamos tu matrícula.')).toBeInTheDocument()
    expect(confirmarSesion).toHaveBeenCalled()
  })

  it('vaciar el campo quita la matrícula', async () => {
    cliente.put.mockResolvedValue({ data: { ...profesional, matricula: null } })
    abrir(profesional)
    await userEvent.clear(screen.getByRole('textbox', { name: 'Matrícula' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(cliente.put).toHaveBeenCalledWith('/usuarios/yo/matricula', { matricula: null })
    expect(await screen.findByText('Quitamos tu matrícula.')).toBeInTheDocument()
  })

  it('si falla, lo avisa', async () => {
    cliente.put.mockRejectedValue({ response: { status: 500 } })
    abrir(profesional)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(
      await screen.findByText('No pudimos guardar la matrícula. Intentá nuevamente.'),
    ).toBeInTheDocument()
  })

  it('una cuenta de familia no ve la sección de matrícula', () => {
    abrir({ ...profesional, tipoCuenta: 'FAMILIA', especialidades: [], matricula: null })
    expect(screen.queryByRole('heading', { name: 'Matrícula' })).not.toBeInTheDocument()
    expect(screen.getByText('Soy familia')).toBeInTheDocument()
  })
})

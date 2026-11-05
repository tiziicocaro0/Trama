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
    post: vi.fn(),
    delete: vi.fn(),
  },
}))
// El recortador real usa gestos y canvas: se simula la zona elegida.
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }) => (
    <button type="button" onClick={() => onCropComplete({}, { x: 0, y: 0, width: 80, height: 80 })}>
      Encuadrar
    </button>
  ),
}))
vi.mock('../../utils/recortarImagen.js', () => ({
  recortarImagen: vi.fn(async () => new Blob(['jpg'], { type: 'image/jpeg' })),
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
  window.URL.createObjectURL = vi.fn(() => 'blob:mi-foto')
  window.URL.revokeObjectURL = vi.fn()
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/foto') ? new Blob(['foto'], { type: 'image/jpeg' }) : [],
  }))
  cliente.put.mockReset()
  cliente.post.mockReset().mockResolvedValue({ data: null })
  cliente.delete.mockReset().mockResolvedValue({ data: null })
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

  it('sube su foto recortada y la muestra', async () => {
    const user = userEvent.setup()
    const confirmarSesion = abrir({ ...profesional, tieneFoto: false })
    expect(screen.getByRole('img', { name: 'Foto de Pía no disponible' })).toBeInTheDocument()
    await user.upload(
      screen.getByLabelText('Elegir una foto'),
      new File(['x'], 'yo.png', { type: 'image/png' }),
    )
    await user.click(screen.getByRole('button', { name: 'Encuadrar' }))
    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }))
    expect(cliente.post).toHaveBeenCalledWith(
      '/usuarios/yo/foto',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )
    expect(cliente.post.mock.calls[0][1].get('archivo')).toBeInstanceOf(Blob)
    expect(await screen.findByRole('img', { name: 'Foto de Pía' })).toHaveAttribute('src', 'blob:mi-foto')
    expect(confirmarSesion).toHaveBeenCalled()
  })

  it('quita su foto', async () => {
    const user = userEvent.setup()
    abrir({ ...profesional, tieneFoto: true })
    await user.click(await screen.findByRole('button', { name: 'Quitar foto' }))
    expect(cliente.delete).toHaveBeenCalledWith('/usuarios/yo/foto')
    expect(await screen.findByRole('img', { name: 'Foto de Pía no disponible' })).toBeInTheDocument()
  })

  it('una cuenta de familia no ve la sección de matrícula', () => {
    abrir({ ...profesional, tipoCuenta: 'FAMILIA', especialidades: [], matricula: null })
    expect(screen.queryByRole('heading', { name: 'Matrícula' })).not.toBeInTheDocument()
    expect(screen.getByText('Soy familia')).toBeInTheDocument()
  })
})

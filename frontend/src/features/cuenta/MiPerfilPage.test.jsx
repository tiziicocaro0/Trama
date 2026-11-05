import { render, screen, within } from '@testing-library/react'
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

  it('sin matrícula ofrece Sumar matrícula, con número obligatorio y comprobante opcional', async () => {
    const user = userEvent.setup()
    cliente.put.mockResolvedValue({ data: { ...profesional, matricula: 'MP 778' } })
    cliente.post.mockResolvedValue({
      data: { ...profesional, matricula: 'MP 778', tieneComprobanteMatricula: true },
    })
    abrir({ ...profesional, matricula: null })
    await user.click(screen.getByRole('button', { name: 'Sumar matrícula' }))
    const ventana = screen.getByRole('dialog', { name: 'Sumar matrícula' })
    expect(within(ventana).getByText(/tapalos antes de subirlo/)).toBeInTheDocument()

    // El número es obligatorio
    await user.click(within(ventana).getByRole('button', { name: 'Guardar matrícula' }))
    expect(within(ventana).getByText('Ingresá el número de matrícula.')).toBeInTheDocument()
    expect(cliente.put).not.toHaveBeenCalled()

    const numero = within(ventana).getByRole('textbox', { name: 'Número de matrícula' })
    expect(numero).toHaveAttribute('maxLength', '40')
    await user.type(numero, ' MP 778 ')
    const pdf = new File(['%PDF-1.4'], 'matricula.pdf', { type: 'application/pdf' })
    await user.upload(within(ventana).getByLabelText(/Comprobante/), pdf)
    await user.click(within(ventana).getByRole('button', { name: 'Guardar matrícula' }))

    // Primero el número, después el comprobante
    expect(cliente.put).toHaveBeenCalledExactlyOnceWith('/usuarios/yo/matricula', { matricula: 'MP 778' })
    expect(cliente.post).toHaveBeenCalledWith(
      '/usuarios/yo/matricula/comprobante',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )
    expect(cliente.post.mock.calls[0][1].get('archivo')).toHaveProperty('name', 'matricula.pdf')
    expect(await screen.findByText('Guardamos tu matrícula.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('MP 778')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver comprobante' })).toBeInTheDocument()
  })

  it('se puede guardar solo el número, sin comprobante', async () => {
    const user = userEvent.setup()
    cliente.put.mockResolvedValue({ data: { ...profesional, matricula: 'MP 778' } })
    abrir({ ...profesional, matricula: null })
    await user.click(screen.getByRole('button', { name: 'Sumar matrícula' }))
    await user.type(screen.getByRole('textbox', { name: 'Número de matrícula' }), 'MP 778')
    await user.click(screen.getByRole('button', { name: 'Guardar matrícula' }))
    expect(await screen.findByText('Guardamos tu matrícula.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Ver comprobante' })).not.toBeInTheDocument()
  })

  it('rechaza un comprobante que no es PDF, JPG ni PNG', async () => {
    const user = userEvent.setup({ applyAccept: false })
    abrir({ ...profesional, matricula: null })
    await user.click(screen.getByRole('button', { name: 'Sumar matrícula' }))
    await user.upload(
      screen.getByLabelText(/Comprobante/),
      new File(['x'], 'matricula.docx', { type: 'application/msword' }),
    )
    expect(screen.getByText('El comprobante tiene que ser PDF, JPG o PNG.')).toBeInTheDocument()
  })

  it('con matrícula la muestra con el (i) y permite cambiarla o quitarla', async () => {
    const user = userEvent.setup()
    cliente.put.mockResolvedValue({ data: { ...profesional, matricula: null } })
    const confirmarSesion = abrir({ ...profesional, tieneComprobanteMatricula: true })
    expect(screen.getByText('MN 45.123')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sobre la matrícula' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('TRAMA no verifica')

    await user.click(screen.getByRole('button', { name: 'Cambiar matrícula' }))
    expect(screen.getByRole('textbox', { name: 'Número de matrícula' })).toHaveValue('MN 45.123')
    expect(screen.getByText(/Si subís otro, reemplaza al anterior/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await user.click(screen.getByRole('button', { name: 'Quitar matrícula' }))
    expect(cliente.put).toHaveBeenCalledWith('/usuarios/yo/matricula', { matricula: null })
    expect(await screen.findByText('Quitamos tu matrícula.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sumar matrícula' })).toBeInTheDocument()
    expect(confirmarSesion).toHaveBeenCalled()
  })

  it('quita solo el comprobante', async () => {
    const user = userEvent.setup()
    cliente.delete.mockResolvedValue({
      data: { ...profesional, tieneComprobanteMatricula: false },
    })
    abrir({ ...profesional, tieneComprobanteMatricula: true })
    await user.click(screen.getByRole('button', { name: 'Quitar comprobante' }))
    expect(cliente.delete).toHaveBeenCalledWith('/usuarios/yo/matricula/comprobante')
    expect(await screen.findByText('Quitamos el comprobante.')).toBeInTheDocument()
    expect(screen.getByText('MN 45.123')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver comprobante' })).not.toBeInTheDocument()
  })

  it('si falla al guardar, lo avisa sin cerrar la ventana', async () => {
    const user = userEvent.setup()
    cliente.put.mockRejectedValue({ response: { status: 500 } })
    abrir({ ...profesional, matricula: null })
    await user.click(screen.getByRole('button', { name: 'Sumar matrícula' }))
    await user.type(screen.getByRole('textbox', { name: 'Número de matrícula' }), 'MP 1')
    await user.click(screen.getByRole('button', { name: 'Guardar matrícula' }))
    expect(
      await screen.findByText('No pudimos guardar la matrícula. Intentá nuevamente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
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

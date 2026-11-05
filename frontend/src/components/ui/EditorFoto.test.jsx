import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditorFoto from './EditorFoto.jsx'
import { recortarImagen } from '../../utils/recortarImagen.js'

// El recortador real usa gestos y canvas: en los tests se simula la zona elegida.
vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }) => (
    <button
      type="button"
      onClick={() => onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 })}
    >
      Encuadrar
    </button>
  ),
}))
vi.mock('../../utils/recortarImagen.js', () => ({ recortarImagen: vi.fn() }))

const recorte = new Blob(['jpg'], { type: 'image/jpeg' })

beforeEach(() => {
  window.URL.createObjectURL = vi.fn(() => 'blob:original')
  window.URL.revokeObjectURL = vi.fn()
  vi.mocked(recortarImagen).mockReset().mockResolvedValue(recorte)
})

function abrir(props = {}) {
  const onGuardar = vi.fn().mockResolvedValue(undefined)
  render(<EditorFoto nombre="Luz" onGuardar={onGuardar} {...props} />)
  return { onGuardar }
}

function archivo(tipo = 'image/jpeg', tamano = 1000) {
  const foto = new File(['x'], 'foto.jpg', { type: tipo })
  Object.defineProperty(foto, 'size', { value: tamano })
  return foto
}

describe('Editor de foto de perfil', () => {
  it('sin foto muestra el ícono y ofrece subir una', () => {
    abrir()
    expect(screen.getByRole('img', { name: 'Foto de Luz no disponible' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir foto' })).toBeInTheDocument()
  })

  it('recorta la foto elegida y guarda solo el recorte', async () => {
    const user = userEvent.setup()
    const { onGuardar } = abrir()
    await user.upload(screen.getByLabelText('Elegir una foto'), archivo())
    expect(screen.getByRole('dialog', { name: 'Encuadrá la foto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar esta foto' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Encuadrar' }))
    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }))
    expect(recortarImagen).toHaveBeenCalledWith('blob:original', { x: 0, y: 0, width: 100, height: 100 })
    expect(onGuardar).toHaveBeenCalledExactlyOnceWith(recorte)
    expect(await screen.findByText('Guardamos la foto.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si falla al guardar, avisa sin cerrar el recorte', async () => {
    const user = userEvent.setup()
    const { onGuardar } = abrir()
    onGuardar.mockRejectedValue({ response: { data: { mensaje: 'La foto tiene que ser JPG o PNG' } } })
    await user.upload(screen.getByLabelText('Elegir una foto'), archivo())
    await user.click(screen.getByRole('button', { name: 'Encuadrar' }))
    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('La foto tiene que ser JPG o PNG')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('rechaza otros formatos y fotos muy pesadas sin abrir el recorte', async () => {
    const user = userEvent.setup({ applyAccept: false })
    abrir()
    await user.upload(screen.getByLabelText('Elegir una foto'), archivo('application/pdf'))
    expect(screen.getByText('Elegí una foto en JPG o PNG.')).toBeInTheDocument()
    await user.upload(screen.getByLabelText('Elegir una foto'), archivo('image/png', 16 * 1024 * 1024))
    expect(screen.getByText(/Elegí una de menos de 15 MB/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('con foto muestra el lápiz para cambiarla, sin botón de quitar', () => {
    abrir({ src: 'blob:actual' })
    expect(screen.getByRole('img', { name: 'Foto de Luz' })).toHaveAttribute('src', 'blob:actual')
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Quitar foto' })).not.toBeInTheDocument()
  })
})

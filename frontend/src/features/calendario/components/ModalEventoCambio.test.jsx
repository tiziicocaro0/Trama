import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import cliente from '../../../api/cliente.js'
import { crearEvento, editarEvento } from '../../../api/eventos.js'
import ModalEvento from './ModalEvento.jsx'

vi.mock('../../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, post: vi.fn(), put: vi.fn() } }))
vi.mock('../../../components/ui/SubirArchivo.jsx', () => ({ default: () => null }))

const evento = { id: 'evento-1', proyectoId: 'proyecto-1', titulo: 'Visita', fecha: '2026-11-10', horaInicio: '09:00', horaFin: '10:00', esCambio: true }

function mostrar(props = {}) {
  const onGuardar = vi.fn((datos) => props.evento
    ? editarEvento('proyecto-1', props.evento.id, datos)
    : crearEvento('proyecto-1', datos))
  render(<MemoryRouter><ModalEvento abierto proyectoId="proyecto-1" fechaPorDefecto="2026-11-10" onCerrar={vi.fn()} onGuardar={onGuardar} {...props} /></MemoryRouter>)
  return onGuardar
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
  cliente.post.mockResolvedValue({ data: {} })
  cliente.put.mockResolvedValue({ data: {} })
})

describe('Cambio de rutina en el formulario', () => {
  it('crea desmarcado y envía esCambio al marcarlo', async () => {
    mostrar()
    const casilla = screen.getByRole('checkbox', { name: 'Es un cambio en su rutina (avisar a la red)' })
    expect(casilla).not.toBeChecked()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Excursión' } })
    fireEvent.click(casilla)
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    await waitFor(() => expect(cliente.post).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos', expect.objectContaining({ titulo: 'Excursión', esCambio: true })))
  })

  it('envía false para un evento común', async () => {
    mostrar()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Actividad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    await waitFor(() => expect(cliente.post).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos', expect.objectContaining({ esCambio: false })))
  })

  it('refleja el valor guardado y permite desmarcarlo al editar', async () => {
    mostrar({ evento })
    const casilla = screen.getByRole('checkbox', { name: 'Es un cambio en su rutina (avisar a la red)' })
    expect(casilla).toBeChecked()
    fireEvent.click(casilla)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(cliente.put).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos/evento-1', expect.objectContaining({ esCambio: false })))
  })

  it('permite activar el cambio al editar un evento común', async () => {
    mostrar({ evento: { ...evento, esCambio: false } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Es un cambio en su rutina (avisar a la red)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(cliente.put).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos/evento-1', expect.objectContaining({ esCambio: true })))
  })

  it('explica que el cambio se edita en la serie cuando es una ocurrencia', () => {
    mostrar({ evento: { ...evento, recurrente: true }, alcance: 'ocurrencia' })
    expect(screen.getByRole('checkbox', { name: 'Es un cambio en su rutina (avisar a la red)' })).toBeDisabled()
    expect(screen.getByText('Para cambiar esta opción, editá toda la serie.')).toBeInTheDocument()
  })
})

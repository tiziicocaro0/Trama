import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import AvisoEliminacion from './AvisoEliminacion.jsx'
import ZonaEliminarPerfil from './ZonaEliminarPerfil.jsx'
import { coincideNombre } from './eliminacion.js'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, post: vi.fn(), delete: vi.fn() },
}))

const proyecto = { id: '0f8b4fc3-e754-4707-8769-28d7210de226', nombre: 'Tomás', eliminacionProgramada: null }
const programado = { ...proyecto, eliminacionProgramada: '2026-11-11T12:00:00Z' }

beforeEach(() => {
  cliente.post.mockReset().mockResolvedValue({ data: programado })
  cliente.delete.mockReset().mockResolvedValue({ data: proyecto })
})

describe('8.2: eliminar el perfil', () => {
  it('para confirmar hay que escribir el nombre del niño (sin importar tildes ni mayúsculas)', () => {
    expect(coincideNombre(' tomas ', 'Tomás')).toBe(true)
    expect(coincideNombre('Tomi', 'Tomás')).toBe(false)
    expect(coincideNombre('', '')).toBe(false)
  })

  it('programa la eliminación recién cuando el nombre coincide', async () => {
    render(<ZonaEliminarPerfil proyecto={proyecto} />)
    expect(screen.getByText(/Tenés 7 días para arrepentirte/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }))
    const confirmar = screen.getByRole('button', { name: 'Eliminar en 7 días' })
    expect(confirmar).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Nombre del niño'), 'Tomi')
    expect(confirmar).toBeDisabled()
    await userEvent.clear(screen.getByLabelText('Nombre del niño'))
    await userEvent.type(screen.getByLabelText('Nombre del niño'), 'tomas')
    await userEvent.click(confirmar)
    expect(cliente.post).toHaveBeenCalledExactlyOnceWith(`/proyectos/${proyecto.id}/eliminacion`)
    expect(await screen.findByText(/Este perfil se va a eliminar el 11 de noviembre de 2026/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar eliminación' })).toBeInTheDocument()
  })

  it('el aviso de la portada deja cancelar solo al tutor administrador', async () => {
    const onCancelada = vi.fn()
    const { rerender } = render(<AvisoEliminacion proyecto={programado} esAdmin={false} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Este perfil se va a eliminar el 11 de noviembre de 2026.')
    expect(screen.queryByRole('button', { name: 'Cancelar eliminación' })).not.toBeInTheDocument()

    rerender(<AvisoEliminacion proyecto={programado} esAdmin onCancelada={onCancelada} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar eliminación' }))
    expect(cliente.delete).toHaveBeenCalledExactlyOnceWith(`/proyectos/${proyecto.id}/eliminacion`)
    expect(onCancelada).toHaveBeenCalledWith(proyecto)
  })

  it('no muestra nada si no hay una eliminación programada', () => {
    const { container } = render(<AvisoEliminacion proyecto={proyecto} esAdmin />)
    expect(container).toBeEmptyDOMElement()
  })
})

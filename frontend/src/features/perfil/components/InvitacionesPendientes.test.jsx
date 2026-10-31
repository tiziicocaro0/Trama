import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import InvitacionesPendientes from './InvitacionesPendientes.jsx'

vi.mock('../../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

const proyectoId = '0f8b4fc3-e754-4707-8769-28d7210de226'
const pendientes = [
  {
    id: 'inv-1',
    email: 'docente@ejemplo.test',
    rol: 'EDUCACION',
    estado: 'PENDIENTE',
    venceEn: '2026-11-07T15:00:00Z',
  },
  {
    id: 'inv-2',
    email: 'abuela@ejemplo.test',
    rol: 'FAMILIAR',
    estado: 'PENDIENTE',
    venceEn: '2026-11-08T15:00:00Z',
  },
]
let lista

beforeEach(() => {
  lista = [...pendientes]
  cliente.get.mockReset().mockImplementation(async () => ({ data: lista }))
  cliente.delete.mockReset().mockImplementation(async (ruta) => {
    lista = lista.filter((invitacion) => !ruta.endsWith(invitacion.id))
  })
})

describe('Invitaciones pendientes (1.3)', () => {
  it('lista las pendientes con su rol y fecha de vencimiento', async () => {
    render(<InvitacionesPendientes proyectoId={proyectoId} />)
    expect(await screen.findByText('docente@ejemplo.test')).toBeInTheDocument()
    expect(screen.getByText('Educación')).toBeInTheDocument()
    expect(screen.getByText('abuela@ejemplo.test')).toBeInTheDocument()
    expect(screen.getAllByText(/^Vence:/)).toHaveLength(2)
    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/invitaciones`,
      expect.anything(),
    )
  })

  it('cancela una invitación y la saca de la lista', async () => {
    render(<InvitacionesPendientes proyectoId={proyectoId} />)
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Cancelar la invitación a docente@ejemplo.test',
      }),
    )
    expect(cliente.delete).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/invitaciones/inv-1`,
    )
    await screen.findByRole('button', {
      name: 'Cancelar la invitación a abuela@ejemplo.test',
    })
    expect(screen.queryByText('docente@ejemplo.test')).not.toBeInTheDocument()
  })

  it('muestra el mensaje del servidor si no se puede cancelar', async () => {
    cliente.delete.mockRejectedValue({
      response: { data: { mensaje: 'La invitación ya fue aceptada o cancelada' } },
    })
    render(<InvitacionesPendientes proyectoId={proyectoId} />)
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Cancelar la invitación a docente@ejemplo.test',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La invitación ya fue aceptada o cancelada',
    )
  })

  it('avisa si no puede cargar la lista', async () => {
    cliente.get.mockRejectedValue(new Error('Sin conexión'))
    render(<InvitacionesPendientes proyectoId={proyectoId} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las invitaciones pendientes.',
    )
  })

  it('indica cuando no hay invitaciones pendientes', async () => {
    lista = []
    render(<InvitacionesPendientes proyectoId={proyectoId} />)
    expect(
      await screen.findByText('No hay invitaciones pendientes.'),
    ).toBeInTheDocument()
  })
})

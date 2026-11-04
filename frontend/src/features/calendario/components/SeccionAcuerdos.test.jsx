import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import SeccionAcuerdos from './SeccionAcuerdos.jsx'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const proyectoId = '7b933b41-4a0d-4271-a764-7780ca5c86e4'
const reunion = { id: 'reunion-1', tipo: 'REUNION', titulo: 'Reunión de equipo' }
const miembros = [
  { id: 'm-1', usuarioId: 'u-docente', nombre: 'Lucía', apellido: 'Pérez' },
  { id: 'm-2', usuarioId: 'u-tutora', nombre: 'Valeria', apellido: 'Gómez' },
]
let acuerdos

beforeEach(() => {
  acuerdos = [
    { id: 'a-1', reunionId: 'reunion-1', descripcion: 'Usar pictogramas en el recreo', responsableId: 'u-docente', responsableNombre: 'Lucía Pérez', fechaRevision: '2026-10-20', cumplido: false, vencido: true, puedeEditar: true, puedeMarcarCumplido: true },
    { id: 'a-2', reunionId: 'reunion-1', descripcion: 'Avisar cambios con un día de anticipación', responsableId: 'u-tutora', responsableNombre: 'Valeria Gómez', fechaRevision: '2026-12-01', cumplido: true, vencido: false, puedeEditar: false, puedeMarcarCumplido: false },
  ]
  cliente.get.mockReset().mockImplementation(async () => ({ data: acuerdos }))
  cliente.post.mockReset().mockImplementation(async (_ruta, cuerpo) => {
    const nuevo = { id: 'a-3', ...cuerpo, responsableNombre: 'Valeria Gómez', cumplido: false, vencido: false, puedeMarcarCumplido: true }
    acuerdos = [...acuerdos, nuevo]
    return { data: nuevo }
  })
  cliente.put.mockReset().mockImplementation(async (ruta, cuerpo) => {
    acuerdos = acuerdos.map((a) => (ruta.includes(a.id) ? { ...a, cumplido: cuerpo.cumplido, vencido: false } : a))
    return { data: {} }
  })
})

describe('5.6: acuerdos en el detalle de la reunión', () => {
  it('lista los acuerdos con responsable, fecha y si se cumplieron', async () => {
    render(<SeccionAcuerdos proyectoId={proyectoId} reunion={reunion} miembros={miembros} />)
    const seccion = screen.getByRole('region', { name: 'Acuerdos de la reunión' })
    expect(await within(seccion).findByText('Usar pictogramas en el recreo')).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/acuerdos`, expect.objectContaining({ params: { reunionId: 'reunion-1' } }))
    expect(within(seccion).getByText(/Lucía Pérez · revisar el 20\/10\/2026/)).toBeInTheDocument()
    expect(within(seccion).getByText('Vencido')).toBeInTheDocument()
    const casillas = within(seccion).getAllByRole('checkbox')
    expect(casillas[0]).not.toBeChecked()
    expect(casillas[1]).toBeChecked()
    expect(casillas[1]).toBeDisabled()
  })

  it('el responsable marca un acuerdo como cumplido', async () => {
    render(<SeccionAcuerdos proyectoId={proyectoId} reunion={reunion} miembros={miembros} />)
    await screen.findByText('Usar pictogramas en el recreo')
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(cliente.put).toHaveBeenCalledWith(`/proyectos/${proyectoId}/acuerdos/a-1/cumplido`, { cumplido: true })
    await vi.waitFor(() => expect(screen.getAllByRole('checkbox')[0]).toBeChecked())
    expect(screen.queryByText('Vencido')).not.toBeInTheDocument()
  })

  it('agrega un acuerdo con responsable y fecha de revisión', async () => {
    render(<SeccionAcuerdos proyectoId={proyectoId} reunion={reunion} miembros={miembros} puedeAgregar />)
    await screen.findByText('Usar pictogramas en el recreo')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar acuerdo' }))
    const formulario = screen.getByRole('form', { name: 'Nuevo acuerdo' })
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar acuerdo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Completá el acuerdo, el responsable y la fecha de revisión.')
    await userEvent.type(within(formulario).getByLabelText('Qué se acordó'), 'Probar la agenda visual en casa')
    await userEvent.selectOptions(within(formulario).getByLabelText('Responsable'), 'u-tutora')
    await userEvent.type(within(formulario).getByLabelText('Fecha de revisión'), '15122026')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar acuerdo' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${proyectoId}/acuerdos`, {
      reunionId: 'reunion-1',
      descripcion: 'Probar la agenda visual en casa',
      responsableId: 'u-tutora',
      fechaRevision: '2026-12-15',
    })
    expect(await screen.findByText('Probar la agenda visual en casa')).toBeInTheDocument()
  })

  it('sin permiso de carga no ofrece agregar acuerdos', async () => {
    render(<SeccionAcuerdos proyectoId={proyectoId} reunion={reunion} miembros={miembros} />)
    await screen.findByText('Usar pictogramas en el recreo')
    expect(screen.queryByRole('button', { name: 'Agregar acuerdo' })).not.toBeInTheDocument()
  })
})

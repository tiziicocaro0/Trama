import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import { crearEvento } from '../../../api/eventos.js'
import ProximosCambios from './ProximosCambios.jsx'

vi.mock('../../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() } }))

const proyectoId = 'proyecto-ficticio'

function abrir() {
  render(
    <MemoryRouter>
      <ProximosCambios proyectoId={proyectoId} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.get.mockReset()
  cliente.post.mockReset()
})

it('muestra solo los cambios de rutina de los próximos 7 días, ordenados', async () => {
  cliente.get.mockResolvedValue({
    data: [
      { id: 'b', titulo: 'Sin clases', fecha: '2026-11-20', horaInicio: '08:00:00', esCambio: true },
      { id: 'c', titulo: 'Natación', fecha: '2026-11-18', horaInicio: '18:00:00', esCambio: false },
      { id: 'a', titulo: 'Acto escolar', fecha: '2026-11-14', horaInicio: '10:00:00', esCambio: true },
    ],
  })
  abrir()

  expect(await screen.findByRole('heading', { name: 'Cambios en su rutina esta semana' })).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('14/11/2026 · 10:00Acto escolar')
  expect(items[1]).toHaveTextContent('Sin clases')
  expect(screen.queryByText('Natación')).not.toBeInTheDocument()
  expect(cliente.get).toHaveBeenCalledWith(
    `/proyectos/${proyectoId}/eventos`,
    expect.objectContaining({ params: expect.objectContaining({ desde: expect.any(String), hasta: expect.any(String) }) }),
  )
})

it('no ocupa lugar si no hay cambios', async () => {
  cliente.get.mockResolvedValue({ data: [{ id: 'c', titulo: 'Natación', fecha: '2026-11-18', esCambio: false }] })
  const { container } = render(<MemoryRouter><ProximosCambios proyectoId={proyectoId} /></MemoryRouter>)
  await vi.waitFor(() => expect(cliente.get).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})

it('al crear un evento envía si es un cambio en su rutina (5.4)', async () => {
  cliente.post.mockResolvedValue({ data: { id: 'nuevo' } })
  await crearEvento(proyectoId, { titulo: 'Acto', fecha: '2026-11-14', horaInicio: '10:00', horaFin: '11:00', esCambio: true })
  expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ esCambio: true }))
})

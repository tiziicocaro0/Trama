import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import { crearEvento } from '../../../api/eventos.js'
import ProximosEventos from './ProximosEventos.jsx'

vi.mock('../../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() } }))

const proyectoId = 'proyecto-ficticio'

function abrir() {
  render(
    <MemoryRouter>
      <ProximosEventos proyectoId={proyectoId} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.get.mockReset()
  cliente.post.mockReset()
})

it('muestra todo lo de los próximos 7 días, ordenado, con los cambios de rutina resaltados', async () => {
  cliente.get.mockResolvedValue({
    data: [
      { id: 'b', titulo: 'Sin clases', fecha: '2026-11-20', horaInicio: '08:00:00', esCambio: true },
      { id: 'c', titulo: 'Natación', fecha: '2026-09-16', fechaOcurrencia: '2026-11-18', horaInicio: '18:00:00', esCambio: false },
      { id: 'a', titulo: 'Acto escolar', fecha: '2026-11-14', horaInicio: '10:00:00', esCambio: true },
    ],
  })
  abrir()

  expect(await screen.findByRole('heading', { name: /Próximos 7 días/ })).toHaveTextContent('2 cambios en su rutina')
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent('Sáb 14/11 · 10:00Acto escolar (cambio en su rutina)')
  expect(items[1]).toHaveTextContent('Natación')
  expect(items[1]).not.toHaveTextContent('cambio en su rutina')
  expect(items[2]).toHaveTextContent('Sin clases')
  expect(cliente.get).toHaveBeenCalledWith(
    `/proyectos/${proyectoId}/eventos`,
    expect.objectContaining({ params: expect.objectContaining({ desde: expect.any(String), hasta: expect.any(String) }) }),
  )
})

it('no ocupa lugar si no hay nada en los próximos 7 días', async () => {
  cliente.get.mockResolvedValue({ data: [] })
  const { container } = render(<MemoryRouter><ProximosEventos proyectoId={proyectoId} /></MemoryRouter>)
  await vi.waitFor(() => expect(cliente.get).toHaveBeenCalled())
  expect(container).toBeEmptyDOMElement()
})

it('al crear un evento envía si es un cambio en su rutina (5.4)', async () => {
  cliente.post.mockResolvedValue({ data: { id: 'nuevo' } })
  await crearEvento(proyectoId, { titulo: 'Acto', fecha: '2026-11-14', horaInicio: '10:00', horaFin: '11:00', esCambio: true })
  expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ esCambio: true }))
})

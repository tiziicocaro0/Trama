import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import BuscadorPerfil from './components/BuscadorPerfil.jsx'
import BusquedaPage from './BusquedaPage.jsx'

vi.mock('../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn() } }))

function DondeEstoy() {
  const { pathname, search, hash } = useLocation()
  return <p data-testid="ubicacion">{`${pathname}${search}${hash}`}</p>
}

function abrir(ruta) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path="/proyectos/:id/buscar"
          element={<><BuscadorPerfil proyectoId="p1" /><BusquedaPage /><DondeEstoy /></>}
        />
        <Route path="/proyectos/:id/:seccion" element={<DondeEstoy />} />
        <Route path="/proyectos/:id" element={<><BuscadorPerfil proyectoId="p1" /><DondeEstoy /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.get.mockReset().mockResolvedValue({
    data: [
      { id: 'n1', tipo: 'NOTA_PROFESIONAL', titulo: 'Pautas para el acto', fragmento: '…ensayar el acto con anticipación…' },
      { id: 'f1', tipo: 'FORTALEZA', titulo: 'Arma rompecabezas', fragmento: null },
      { id: 'f2', tipo: 'FORTALEZA', titulo: 'Sigue la agenda', fragmento: '…la agenda del acto…' },
    ],
  })
})

it('busca desde el encabezado y muestra los resultados agrupados por sección (4.5)', async () => {
  abrir('/proyectos/p1')
  await userEvent.click(screen.getByRole('button', { name: 'Abrir el buscador del perfil' }))
  // Al abrirse, el cursor ya queda en el campo
  expect(screen.getByRole('searchbox', { name: 'Buscar en el perfil' })).toHaveFocus()
  await userEvent.keyboard('acto{Enter}')
  expect(screen.getByTestId('ubicacion')).toHaveTextContent('/proyectos/p1/buscar?q=acto')
})

it('la lupa se cierra al tocar afuera o con Escape y avisa a la cabecera', async () => {
  const alCambiar = vi.fn()
  render(
    <MemoryRouter>
      <p>Afuera</p>
      <BuscadorPerfil proyectoId="p1" alCambiar={alCambiar} />
    </MemoryRouter>,
  )
  const lupa = screen.getByRole('button', { name: 'Abrir el buscador del perfil' })
  expect(lupa).toHaveAttribute('aria-expanded', 'false')

  await userEvent.click(lupa)
  expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('aria-expanded', 'true')
  expect(alCambiar).toHaveBeenLastCalledWith(true)

  await userEvent.click(screen.getByText('Afuera'))
  expect(screen.getByRole('button', { name: 'Abrir el buscador del perfil' })).toBeInTheDocument()
  expect(alCambiar).toHaveBeenLastCalledWith(false)

  await userEvent.click(screen.getByRole('button', { name: 'Abrir el buscador del perfil' }))
  await userEvent.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Abrir el buscador del perfil' })).toHaveFocus()
})

it('agrupa por sección en el orden del perfil y cada resultado lleva a su aporte', async () => {
  abrir('/proyectos/p1/buscar?q=acto')
  expect(await screen.findByText('3 resultados para «acto»')).toHaveAttribute('role', 'status')
  expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/buscar', expect.objectContaining({ params: { q: 'acto' } }))

  const grupos = screen.getAllByRole('heading', { level: 2 })
  expect(grupos.map((grupo) => grupo.textContent)).toEqual(['Fortalezas (2)', 'Notas (1)'])
  const fortalezas = within(screen.getByRole('region', { name: 'Fortalezas (2)' }))
  expect(fortalezas.getByRole('link', { name: /Sigue la agenda/ })).toHaveTextContent('…la agenda del acto…')

  await userEvent.click(screen.getByRole('link', { name: /Pautas para el acto/ }))
  expect(screen.getByTestId('ubicacion')).toHaveTextContent('/proyectos/p1/notas#aporte-n1')
})

it('avisa cuando no hay resultados', async () => {
  cliente.get.mockResolvedValue({ data: [] })
  abrir('/proyectos/p1/buscar?q=dinosaurio')
  expect(await screen.findByText('No encontramos nada con «dinosaurio».')).toHaveAttribute('role', 'status')
})

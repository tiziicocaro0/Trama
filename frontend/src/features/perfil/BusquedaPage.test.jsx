import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { buscarAportes } from '../../api/aportes.js'
import BusquedaPage from './BusquedaPage.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'

vi.mock('../../api/aportes.js', () => ({ buscarAportes: vi.fn() }))
vi.mock('./components/FotoNinoCabecera.jsx', () => ({ default: () => null }))
vi.mock('../plan/AvisoPlanGratuito.jsx', () => ({ default: () => null }))

function Ubicacion() { const location = useLocation(); return <p data-testid="ubicacion">{location.pathname}{location.search}</p> }
function montarResultados(url = '/proyectos/p1/buscar?q=tren') {
  return render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/proyectos/:id/buscar" element={<BusquedaPage />} /></Routes></MemoryRouter>)
}
beforeEach(() => vi.resetAllMocks())

describe('Búsqueda de aportes', () => {
  it('busca desde el encabezado del proyecto y evita búsquedas vacías', () => {
    render(<MemoryRouter initialEntries={['/proyectos/p1']}><CabeceraPerfil proyecto={{ id: 'p1', nombre: 'Niño ficticio' }} /><Ubicacion /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/proyectos/p1')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar aportes' }), { target: { value: '  tren & sol  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/proyectos/p1/buscar?q=tren+%26+sol')
  })

  it('agrupa resultados y enlaza al aporte y a la bitácora', async () => {
    buscarAportes.mockResolvedValue([
      { id: 'a1', proyectoId: 'p1', tipo: 'INTERES', titulo: 'Trenes', fragmento: 'Un tren azul' },
      { id: 'a2', proyectoId: 'p1', tipo: 'INTERES', titulo: 'Vías', fragmento: null },
      { id: 'a3', proyectoId: 'p1', tipo: 'ABC', titulo: 'Registro', fragmento: 'El tren pasó' },
    ])
    montarResultados()
    expect(screen.getByRole('status')).toHaveTextContent('Buscando aportes')
    expect(await screen.findByText('3 resultados')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Intereses' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bitácora' })).toBeInTheDocument()
    expect(screen.getByText('Un tren azul')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Trenes/ })).toHaveAttribute('href', '/proyectos/p1/intereses#aporte-a1')
    expect(screen.getByRole('link', { name: /Registro/ })).toHaveAttribute('href', '/proyectos/p1/bitacora?aporte=a3')
    expect(buscarAportes).toHaveBeenCalledWith('p1', 'tren', expect.any(AbortSignal))
  })

  it('maneja búsqueda vacía, sin resultados y errores', async () => {
    const vista = montarResultados('/proyectos/p1/buscar?q=%20')
    expect(screen.getByText('Ingresá una palabra o frase para buscar.')).toBeInTheDocument()
    expect(buscarAportes).not.toHaveBeenCalled()
    vista.unmount()
    buscarAportes.mockResolvedValueOnce([])
    const vacio = montarResultados()
    expect(await screen.findByText('No encontramos aportes para esta búsqueda.')).toBeInTheDocument()
    vacio.unmount()
    buscarAportes.mockRejectedValueOnce(new Error('sin conexión'))
    montarResultados()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos buscar los aportes.')
  })
})

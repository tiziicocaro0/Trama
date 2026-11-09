import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listarEventos } from '../../../api/eventos.js'
import ProximosCambios from './ProximosCambios.jsx'

vi.mock('../../../api/eventos.js', () => ({ listarEventos: vi.fn() }))

function mostrar(proyectoId = 'p1') {
  return render(<MemoryRouter><ProximosCambios proyectoId={proyectoId} /></MemoryRouter>)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 10, 12))
  vi.resetAllMocks()
})
afterEach(() => vi.useRealTimers())

describe('Próximos cambios', () => {
  it('consulta siete días locales y filtra, ordena y deduplica ocurrencias', async () => {
    listarEventos.mockResolvedValue([
      { id: 'serie', titulo: 'Último día', fecha: '2026-10-01', fechaOcurrencia: '2026-11-16', horaInicio: '08:30:00', esCambio: true },
      { id: 'normal', titulo: 'Evento común', fecha: '2026-11-10', esCambio: false },
      { id: 'fuera', titulo: 'Fuera de rango', fecha: '2026-11-17', esCambio: true },
      { id: 'antes', titulo: 'Ya pasó', fecha: '2026-11-09', esCambio: true },
      { id: 'hoy', titulo: 'Primero', fecha: '2026-11-10', horaInicio: '10:00:00', esCambio: true },
      { id: 'serie', titulo: 'Último día', fecha: '2026-10-01', fechaOcurrencia: '2026-11-16', horaInicio: '08:30:00', esCambio: true },
      { id: 'temprano', titulo: 'Más temprano', fecha: '2026-11-10', horaInicio: '09:00:00', esCambio: true },
    ])
    mostrar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando próximos cambios')
    const bloque = screen.getByRole('region', { name: 'Próximos cambios' })
    const enlaces = await within(bloque).findAllByRole('link')
    expect(enlaces.map((enlace) => enlace.textContent)).toEqual([
      expect.stringContaining('Más temprano'),
      expect.stringContaining('Primero'),
      expect.stringContaining('Último día'),
    ])
    expect(enlaces[2]).toHaveAttribute('href', '/proyectos/p1/calendario?fecha=2026-11-16')
    expect(enlaces[2]).toHaveTextContent('16/11/2026 · 08:30')
    expect(listarEventos).toHaveBeenCalledWith('p1', { desde: '2026-11-10', hasta: '2026-11-16', signal: expect.any(AbortSignal) })
    expect(screen.queryByText('Evento común')).not.toBeInTheDocument()
    expect(screen.queryByText('Fuera de rango')).not.toBeInTheDocument()
  })

  it('muestra un estado vacío', async () => {
    listarEventos.mockResolvedValue([])
    mostrar()
    expect(await screen.findByText('No hay cambios en los próximos 7 días.')).toBeInTheDocument()
  })

  it('muestra errores y permite reintentar', async () => {
    listarEventos.mockRejectedValueOnce(new Error('sin conexión')).mockResolvedValueOnce([])
    mostrar()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los próximos cambios.')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('No hay cambios en los próximos 7 días.')).toBeInTheDocument()
    expect(listarEventos).toHaveBeenCalledTimes(2)
  })

  it('vuelve a consultar al abrir la portada y respeta el proyecto', async () => {
    listarEventos.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'nuevo', titulo: 'Cambio guardado', fecha: '2026-11-11', esCambio: true }])
    const vista = mostrar('p1')
    await screen.findByText('No hay cambios en los próximos 7 días.')
    vista.unmount()
    mostrar('p2')
    expect(await screen.findByText('Cambio guardado')).toBeInTheDocument()
    expect(listarEventos).toHaveBeenLastCalledWith('p2', expect.objectContaining({ desde: '2026-11-10', hasta: '2026-11-16' }))
  })
})

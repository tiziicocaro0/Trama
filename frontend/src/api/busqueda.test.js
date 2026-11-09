import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from './cliente.js'
import { buscarAportes } from './aportes.js'

vi.mock('./cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())

describe('API de búsqueda', () => {
  it('envía el proyecto y la consulta como parámetro', async () => {
    cliente.get.mockResolvedValue({ data: [{ id: 'a1', proyectoId: 'p1', tipo: 'INTERES', titulo: 'Tren', fragmento: null }] })
    const signal = new AbortController().signal
    expect(await buscarAportes('p1', 'tren & sol', signal)).toHaveLength(1)
    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/buscar', { params: { q: 'tren & sol' }, signal })
  })
})

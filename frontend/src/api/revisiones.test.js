import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from './cliente.js'
import { marcarRevision, obtenerRevision, solicitarRevision } from './revisiones.js'
vi.mock('./cliente.js', () => ({ default: { post: vi.fn(), put: vi.fn(), get: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
describe('API de revisiones', () => {
  it('envía el motivo e identificadores reales', async () => {
    cliente.post.mockResolvedValue({ data: { id: 'r1', estado: 'PENDIENTE' } })
    await solicitarRevision('p1', 'a1', 'Motivo')
    expect(cliente.post).toHaveBeenCalledWith('/proyectos/p1/aportes/a1/revision', { motivo: 'Motivo' })
  })
  it('consulta y marca la revisión por su ID', async () => {
    cliente.get.mockResolvedValue({ data: { id: 'r1', motivo: 'Motivo', estado: 'PENDIENTE' } })
    cliente.put.mockResolvedValue({ data: { id: 'r1', estado: 'REVISADA' } })
    await obtenerRevision('p1', 'r1')
    await marcarRevision('p1', 'r1')
    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/revisiones/r1', { signal: undefined })
    expect(cliente.put).toHaveBeenCalledWith('/proyectos/p1/revisiones/r1')
  })
  it('muestra el conflicto del backend', async () => {
    cliente.post.mockRejectedValue({ response: { status: 409, data: { mensaje: 'Ya existe una revisión pendiente' } } })
    await expect(solicitarRevision('p1', 'a1', 'Motivo')).rejects.toThrow('Ya existe una revisión pendiente')
  })
})

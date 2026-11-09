import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from './cliente.js'
import { descargarMisAportes, descargarPdfPerfil, descargarTodosLosDatos } from './exportacion.js'

vi.mock('./cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn() },
}))

beforeEach(() => {
  cliente.get.mockReset().mockResolvedValue({ data: new Blob(['pdf']) })
  window.URL.createObjectURL = vi.fn(() => 'blob:datos')
  window.URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

describe('8.1: descargar todos los datos', () => {
  it('sin filtros pide todo', async () => {
    await descargarTodosLosDatos('p1', 'pdf')

    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/exportar', {
      params: { formato: 'pdf' },
      responseType: 'blob',
    })
  })

  it('manda los filtros con las listas separadas por coma, como las lee Spring', async () => {
    await descargarTodosLosDatos('p1', 'pdf', {
      desde: '2026-09-01',
      hasta: '2026-11-06',
      tipos: ['FAMILIA', 'DOCENTE'],
      usuarios: ['u1', 'u2'],
    })

    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/exportar', {
      params: { formato: 'pdf', desde: '2026-09-01', hasta: '2026-11-06', tipos: 'FAMILIA,DOCENTE', usuarios: 'u1,u2' },
      responseType: 'blob',
    })
  })

  // 8.4
  it('descarga mis aportes con su propia ruta', async () => {
    await descargarMisAportes('p1', 'json')

    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/mis-aportes/exportar', {
      params: { formato: 'json' },
      responseType: 'blob',
    })
  })

  // 8.3
  it('descarga el PDF del perfil o de Conocelo con su sección', async () => {
    await descargarPdfPerfil('p1', 'conocelo')

    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/exportar-perfil', {
      params: { seccion: 'conocelo' },
      responseType: 'blob',
    })
  })
})

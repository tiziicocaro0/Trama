import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from './cliente.js'
import { obtenerVistaImagen } from './archivos.js'

vi.mock('./cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn() },
}))

const proyectoId = 'proyecto-ficticio'
const archivoId = 'archivo-ficticio'
const crearObjetoOriginal = window.URL.createObjectURL

beforeEach(() => {
  cliente.get.mockReset()
  Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:imagen'),
  })
})

afterEach(() => {
  if (crearObjetoOriginal) {
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: crearObjetoOriginal })
  } else {
    delete window.URL.createObjectURL
  }
})

describe('obtenerVistaImagen', () => {
  it('consulta el archivo real y crea una vista solo si el MIME indica imagen', async () => {
    cliente.get.mockResolvedValue({
      data: new Blob(['imagen'], { type: 'image/png' }),
      headers: { 'content-type': 'image/png' },
    })

    await expect(obtenerVistaImagen(proyectoId, archivoId)).resolves.toBe('blob:imagen')
    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/archivos/${archivoId}`,
      { responseType: 'blob' },
    )
    expect(window.URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('no intenta mostrar un adjunto que no sea una imagen', async () => {
    cliente.get.mockResolvedValue({
      data: new Blob(['documento'], { type: 'application/pdf' }),
      headers: { 'content-type': 'application/pdf' },
    })

    await expect(obtenerVistaImagen(proyectoId, archivoId)).resolves.toBeNull()
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
  })
})

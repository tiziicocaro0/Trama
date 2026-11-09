import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from './cliente.js'
import { crearComentario, listarComentarios } from './comentarios.js'

vi.mock('./cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() } }))

const comentario = { id: 'c1', aporteId: 'a1', autorId: 'u1', autorNombre: 'Ana Ficticia', texto: 'Hola', fecha: '2026-11-10T10:00:00' }
beforeEach(() => vi.clearAllMocks())

describe('API de comentarios', () => {
  it('consulta los comentarios del aporte sin inventar el contador', async () => {
    cliente.get.mockResolvedValue({ data: [comentario] })
    const signal = new AbortController().signal
    expect(await listarComentarios('p1', 'a1', signal)).toEqual([comentario])
    expect(cliente.get).toHaveBeenCalledWith('/proyectos/p1/aportes/a1/comentarios', { signal })
  })

  it('envía el texto en el formato real y devuelve el comentario', async () => {
    cliente.post.mockResolvedValue({ data: comentario })
    expect(await crearComentario('p1', 'a1', 'Hola')).toEqual(comentario)
    expect(cliente.post).toHaveBeenCalledWith('/proyectos/p1/aportes/a1/comentarios', { texto: 'Hola' })
  })

  it('rechaza respuestas incompletas y muestra errores de permisos', async () => {
    cliente.get.mockResolvedValue({ data: [{ ...comentario, aporteId: 'otro' }] })
    await expect(listarComentarios('p1', 'a1')).rejects.toThrow('No pudimos completar')
    cliente.post.mockRejectedValue({ response: { status: 403 } })
    await expect(crearComentario('p1', 'a1', 'Hola')).rejects.toThrow('No tenés permiso')
  })
})

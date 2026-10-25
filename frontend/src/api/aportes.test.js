import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archivar,
  archivarAporte,
  crear,
  crearAporte,
  editar,
  editarAporte,
  listar,
  listarAportes,
} from './aportes.js'
import cliente from './cliente.js'

vi.mock('./cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const proyectoId = '304d3b5e-8c8a-4a50-83d3-a84ade17b697'
const aporteId = 'aporte-1'

describe('api/aportes.js (Tarea 3.0)', () => {
  beforeEach(() => {
    cliente.defaults.baseURL = '/api'
    cliente.get.mockReset()
    cliente.post.mockReset()
    cliente.put.mockReset()
  })

  it('exporta las funciones crear, listar, editar y archivar', () => {
    expect(crear).toBe(crearAporte)
    expect(listar).toBe(listarAportes)
    expect(editar).toBe(editarAporte)
    expect(archivar).toBe(archivarAporte)
  })

  it('lista los aportes del proyecto y permite filtrar por tipo y archivados', async () => {
    const listaMock = [
      {
        id: aporteId,
        tipo: 'FORTALEZA',
        titulo: 'Memoria visual',
        puedeEditar: true,
      },
    ]
    cliente.get.mockResolvedValue({ data: listaMock })

    const res = await listarAportes(proyectoId, {
      tipo: 'FORTALEZA',
      archivados: false,
    })

    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/aportes`,
      { params: { tipo: 'FORTALEZA', archivados: false } },
    )
    expect(res.aportes).toEqual(listaMock)
  })

  it('crea un aporte propio con POST /proyectos/:id/aportes', async () => {
    const nuevo = {
      tipo: 'FORTALEZA',
      titulo: 'Le gusta armar bloques',
      contenido: 'Construye torres complejas',
      datos: '{"contexto":"CASA"}',
      visibilidad: 'TODOS',
    }
    cliente.post.mockResolvedValue({ data: { id: aporteId, ...nuevo } })

    const resultado = await crearAporte(proyectoId, nuevo)

    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/aportes`,
      nuevo,
    )
    expect(resultado.id).toBe(aporteId)
  })

  it('edita un aporte propio con PUT /proyectos/:id/aportes/:aporteId y rechaza 403 si es ajeno', async () => {
    const payload = {
      tipo: 'FORTALEZA',
      titulo: 'Actualizado',
      contenido: 'Texto',
      visibilidad: 'TODOS',
    }
    cliente.put.mockResolvedValueOnce({ data: { id: aporteId, ...payload } })

    const editado = await editarAporte(proyectoId, aporteId, payload)
    expect(cliente.put).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/aportes/${aporteId}`,
      payload,
    )
    expect(editado.titulo).toBe('Actualizado')

    cliente.put.mockRejectedValueOnce({ response: { status: 403 } })
    await expect(editarAporte(proyectoId, aporteId, payload)).rejects.toThrow(
      /Solo su autor puede modificarlo/,
    )
  })

  it('archiva un aporte con POST /proyectos/:id/aportes/:aporteId/archivar y rechaza 403 si es ajeno', async () => {
    cliente.post.mockResolvedValueOnce({ status: 204 })

    await archivarAporte(proyectoId, aporteId)
    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/aportes/${aporteId}/archivar`,
    )

    cliente.post.mockRejectedValueOnce({ response: { status: 403 } })
    await expect(archivarAporte(proyectoId, aporteId)).rejects.toThrow(
      /Solo su autor puede archivarlo/,
    )
  })
})


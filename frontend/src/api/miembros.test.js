import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarMiembros, cambiarEspecialidades } from './miembros.js'
import cliente from './cliente.js'

vi.mock('./cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    put: vi.fn(),
  },
}))

const proyectoId = '304d3b5e-8c8a-4a50-83d3-a84ade17b697'

describe('api/miembros.js', () => {
  beforeEach(() => {
    cliente.defaults.baseURL = '/api'
    cliente.get.mockReset()
    cliente.put.mockReset()
  })

  describe('listarMiembros', () => {
    it('devuelve los miembros del proyecto', async () => {
      const miembros = [
        {
          id: 'a1',
          nombre: 'Ana',
          apellido: 'López',
          rol: 'SALUD',
          especialidades: [
            { especialidad: 'PSICOLOGIA', aclaracion: 'Lic. en Psicología' },
          ],
        },
      ]
      cliente.get.mockResolvedValue({ data: miembros })

      const resultado = await listarMiembros(proyectoId)

      expect(cliente.get).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/miembros`,
        { signal: undefined },
      )
      expect(resultado).toEqual(miembros)
    })

    it('rechaza si la respuesta no es un array válido', async () => {
      cliente.get.mockResolvedValue({ data: 'no-array' })
      await expect(listarMiembros(proyectoId)).rejects.toThrow(
        'No pudimos verificar los miembros',
      )
    })

    it('rechaza si un miembro no tiene rol válido', async () => {
      cliente.get.mockResolvedValue({
        data: [{ id: 'x', nombre: 'Test', apellido: 'U', rol: 'INVALIDO' }],
      })
      await expect(listarMiembros(proyectoId)).rejects.toThrow(
        'No pudimos verificar los miembros',
      )
    })

    it('rechaza si falta baseURL', async () => {
      cliente.defaults.baseURL = ''
      await expect(listarMiembros(proyectoId)).rejects.toThrow(
        'Falta configurar la conexión',
      )
    })
  })

  describe('cambiarEspecialidades', () => {
    it('envía PUT con la lista de especialidades', async () => {
      const especialidades = [
        { especialidad: 'PSICOLOGIA', aclaracion: 'Lic. en Psicología Clínica' },
        { especialidad: 'PSICOPEDAGOGIA', aclaracion: null },
      ]
      const respuestaMock = {
        id: 'm1',
        nombre: 'Ana',
        apellido: 'López',
        rol: 'SALUD',
        especialidades,
      }
      cliente.put.mockResolvedValue({ data: respuestaMock })

      const resultado = await cambiarEspecialidades(proyectoId, especialidades)

      expect(cliente.put).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/miembros/me/especialidades`,
        { especialidades },
      )
      expect(resultado).toEqual(respuestaMock)
    })

    it('rechaza si falta baseURL', async () => {
      cliente.defaults.baseURL = ''
      await expect(cambiarEspecialidades(proyectoId, [])).rejects.toThrow(
        'Falta configurar la conexión',
      )
    })
  })
})

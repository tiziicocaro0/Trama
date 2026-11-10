import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import AuthContext from '../../auth/AuthContext.js'
import ComentariosAporte from './ComentariosAporte.jsx'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() },
}))

const aporte = { id: 'aporte-1', proyectoId: 'proyecto-1', titulo: 'Agenda visual', comentarios: 2 }
const miembros = [
  { id: 'm1', usuarioId: 'yo', nombre: 'Laura', apellido: 'Ruiz', rol: 'TUTOR' },
  { id: 'm2', usuarioId: 'u2', nombre: 'María', apellido: 'Díaz', rol: 'EDUCACION' },
  { id: 'm3', usuarioId: 'u3', nombre: 'Diego', apellido: 'Torres', rol: 'SALUD' },
]

function abrir(datos = aporte) {
  render(
    <AuthContext.Provider value={{ usuario: { id: 'yo', nombre: 'Laura', apellido: 'Ruiz' }, estado: 'autenticado' }}>
      <ComentariosAporte aporte={datos} />
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/miembros')
      ? miembros
      : [
          { id: 'c1', autorNombre: 'Diego Torres', texto: 'Muy útil, @María Díaz', fecha: '2026-11-08T10:00:00' },
          { id: 'c2', autorNombre: 'María Díaz', texto: 'En el aula también', fecha: '2026-11-09T11:30:00' },
        ],
  }))
  cliente.post.mockReset().mockImplementation(async (_ruta, { texto }) => ({
    data: { id: 'c3', autorNombre: 'Laura Ruiz', texto, fecha: '2026-11-10T09:00:00' },
  }))
})

it('muestra cuántos comentarios hay y los lee al abrir (6.2)', async () => {
  abrir()
  await userEvent.click(screen.getByRole('button', { name: '2 comentarios' }))
  const lista = await screen.findByRole('list', { name: 'Comentarios de Agenda visual' })
  expect(within(lista).getAllByRole('listitem')).toHaveLength(2)
  expect(within(lista).getByText('@María Díaz')).toHaveClass('text-primario')
  expect(cliente.get).toHaveBeenCalledWith('/proyectos/proyecto-1/aportes/aporte-1/comentarios', expect.anything())
})

it('al escribir @ sugiere miembros (sin uno mismo) y publica la mención con nombre y apellido', async () => {
  abrir()
  await userEvent.click(screen.getByRole('button', { name: '2 comentarios' }))
  await screen.findByRole('list', { name: 'Comentarios de Agenda visual' })
  const campo = screen.getByRole('combobox', { name: 'Comentar Agenda visual' })

  await userEvent.type(campo, 'Gracias @mar')
  const opciones = await screen.findAllByRole('option')
  expect(opciones).toHaveLength(1)
  expect(opciones[0]).toHaveTextContent('María Díaz')
  await userEvent.keyboard('{Enter}')
  expect(campo).toHaveValue('Gracias @María Díaz ')

  await userEvent.type(campo, 'lo vemos')
  await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(cliente.post).toHaveBeenCalledWith('/proyectos/proyecto-1/aportes/aporte-1/comentarios', {
    texto: 'Gracias @María Díaz lo vemos',
  })
  expect(await screen.findByText('Laura Ruiz')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '3 comentarios' })).toBeInTheDocument()
}, 15000) // escribe letra por letra: con toda la suite corriendo en paralelo puede tardar

it('sin comentarios invita a comentar', () => {
  abrir({ ...aporte, comentarios: 0 })
  expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument()
})

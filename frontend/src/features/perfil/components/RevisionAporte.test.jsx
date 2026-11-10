import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import AuthContext from '../../auth/AuthContext.js'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const base = {
  id: 'aporte-1', proyectoId: 'proyecto-1', tipo: 'FORTALEZA', titulo: 'Arma rompecabezas',
  contenido: 'Empieza por los bordes', datos: '{"contexto":"CASA"}', visibilidad: 'TODOS',
  autorId: 'autora', autorNombre: 'María Díaz', creadoEn: '2026-11-01T12:00:00Z', comentarios: 0,
}

function abrir(aporte, { usuarioId = 'tutora', puedePedirRevision = false, alActualizar = vi.fn() } = {}) {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ usuario: { id: usuarioId, nombre: 'Laura' }, estado: 'autenticado' }}>
        <TarjetaAporte aporte={aporte} puedePedirRevision={puedePedirRevision} alActualizar={alActualizar} />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return alActualizar
}

beforeEach(() => {
  cliente.get.mockReset()
  cliente.post.mockReset()
  cliente.put.mockReset()
})

it('un tutor pide la revisión de un aporte ajeno, con motivo obligatorio (3.4)', async () => {
  cliente.post.mockResolvedValue({ data: { id: 'revision-1', estado: 'PENDIENTE' } })
  const alActualizar = abrir(base, { puedePedirRevision: true })

  await userEvent.click(screen.getByRole('button', { name: 'Más opciones: Arma rompecabezas' }))
  await userEvent.click(screen.getByRole('button', { name: 'Pedir revisión del aporte: Arma rompecabezas' }))
  await userEvent.click(screen.getByRole('button', { name: 'Pedir revisión' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Contá por qué hay que revisarlo.')
  expect(cliente.post).not.toHaveBeenCalled()

  await userEvent.type(screen.getByRole('textbox', { name: '¿Qué habría que revisar?' }), 'Ya no lo hace solo')
  await userEvent.click(screen.getByRole('button', { name: 'Pedir revisión' }))
  expect(cliente.post).toHaveBeenCalledWith('/proyectos/proyecto-1/aportes/aporte-1/revision', { motivo: 'Ya no lo hace solo' })
  await waitFor(() => expect(alActualizar).toHaveBeenCalled())
})

it.each([
  ['propio', { autorId: 'tutora', puedeEditar: true }, true],
  ['sin ser tutor', {}, false],
  ['con una revisión pendiente', { revisionPendiente: true, revisionPendienteId: 'r1' }, true],
])('no se ofrece pedir revisión de un aporte %s', (_caso, cambios, puedePedirRevision) => {
  abrir({ ...base, ...cambios }, { puedePedirRevision })
  // Sin opciones para esta persona, la tarjeta ni siquiera muestra los tres puntitos
  expect(screen.queryByRole('button', { name: 'Más opciones: Arma rompecabezas' })).not.toBeInTheDocument()
})

it('el autor ve el motivo y marca la revisión como hecha; los demás solo ven el aviso', async () => {
  cliente.get.mockResolvedValue({ data: { id: 'revision-1', motivo: 'Ya no lo hace solo', estado: 'PENDIENTE' } })
  cliente.put.mockResolvedValue({ data: { id: 'revision-1', estado: 'REVISADA' } })
  const pendiente = { ...base, revisionPendiente: true, revisionPendienteId: 'revision-1' }
  const alActualizar = abrir(pendiente, { usuarioId: 'autora' })

  await userEvent.click(screen.getByRole('button', { name: /Revisión pendiente · Ver motivo/ }))
  expect(await screen.findByText('Ya no lo hace solo')).toBeInTheDocument()
  expect(cliente.get).toHaveBeenCalledWith('/proyectos/proyecto-1/revisiones/revision-1')
  await userEvent.click(screen.getByRole('button', { name: 'Marcar como revisada' }))
  expect(cliente.put).toHaveBeenCalledWith('/proyectos/proyecto-1/revisiones/revision-1')
  await waitFor(() => expect(alActualizar).toHaveBeenCalled())
})

it('quien no es el autor ve "Revisión pendiente" sin el motivo', () => {
  abrir({ ...base, revisionPendiente: true, revisionPendienteId: 'revision-1' }, { usuarioId: 'otra' })
  expect(screen.getByText('Revisión pendiente')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Ver motivo/ })).not.toBeInTheDocument()
})

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 9, 20, 12)) })
afterEach(() => vi.useRealTimers())
vi.mock('../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

const proyectoId = '7b933b41-4a0d-4271-a764-7780ca5c86e4'
const eventos = [
  { id: 'uno', proyectoId, autorId: 'autor', titulo: 'Terapia ocupacional', fecha: '2026-10-20', fechaOcurrencia: '2026-10-20', horaInicio: '09:00:00', horaFin: '10:00:00', esCambio: false, recurrente: true },
  { id: 'dos', proyectoId, autorId: 'autor', titulo: 'Cambio de docente', fecha: '2026-10-23', fechaOcurrencia: '2026-10-23', horaInicio: '10:00:00', horaFin: '11:00:00', esCambio: true, recurrente: false },
]

function abrir() {
  render(<MemoryRouter initialEntries={[`/proyectos/${proyectoId}/calendario`]}><AuthContext.Provider value={{ usuario: { id: 'autor' }, estado: 'autenticado' }}><AppRoutes /></AuthContext.Provider></MemoryRouter>)
}

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta, configuracion) => {
    if (ruta.endsWith('/eventos')) return { data: eventos.filter((evento) => evento.fechaOcurrencia >= configuracion.params.desde && evento.fechaOcurrencia <= configuracion.params.hasta) }
    if (ruta.endsWith('/miembros')) return { data: [{ id: 'm-autor', usuarioId: 'autor', nombre: 'Ana', apellido: 'Ficticia', rol: 'EDUCACION' }] }
    if (ruta === `/proyectos/${proyectoId}`) return { data: { id: proyectoId, nombre: 'Niño ficticio', puedeCargar: true } }
    return { data: [] }
  })
})

it('abre en vista semanal, consulta el rango real y cambia a mensual con un clic', async () => {
  abrir()
  expect(await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })).toBeInTheDocument()
  expect(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: 'Calendario' })).toHaveAttribute('href', `/proyectos/${proyectoId}/calendario`)
  expect(screen.getByRole('button', { name: 'Semanal' })).toHaveAttribute('aria-pressed', 'true')
  expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: '2026-10-19', hasta: '2026-10-25' } }))
  await userEvent.click(screen.getByRole('button', { name: 'Mensual' }))
  expect(screen.getByRole('button', { name: 'Mensual' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: '2026-09-28', hasta: '2026-11-01' } })))
})

it('navega al período anterior, siguiente y vuelve a hoy', async () => {
  abrir()
  await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })
  await userEvent.click(screen.getByRole('button', { name: 'Período siguiente' }))
  await waitFor(() => expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: '2026-10-26', hasta: '2026-11-01' } })))
  await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
  expect(await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
  await userEvent.click(screen.getByRole('button', { name: 'Hoy' }))
  expect(await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })).toBeInTheDocument()
})

it('abre creación con fecha preseleccionada al pulsar un día vacío', async () => {
  abrir()
  await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })
  await userEvent.click(screen.getAllByRole('button', { name: /Seleccionar miércoles.*21 de octubre/ })[0])
  const dialogo = await screen.findByRole('dialog', { name: 'Nuevo evento' })
  expect(within(dialogo).getByLabelText('Fecha')).toHaveValue('21/10/2026')
})

it('abre el detalle y diferencia los cambios de rutina', async () => {
  abrir()
  const boton = await screen.findByRole('button', { name: 'Ver evento: Cambio de docente' })
  expect(boton).toHaveTextContent('Cambio de rutina')
  await userEvent.click(boton)
  const detalle = screen.getByRole('dialog', { name: 'Detalle de Cambio de docente' })
  expect(within(detalle).getByRole('heading', { name: 'Cambio de docente' })).toBeInTheDocument()
  expect(within(detalle).getByText('Cambio de rutina')).toBeInTheDocument()
  expect(within(detalle).getByText('Cargado por: Ana Ficticia')).toBeInTheDocument()
  expect(within(detalle).getByRole('link', { name: 'Mostrarle el día' })).toHaveAttribute('href', `/proyectos/${proyectoId}/hoy?fecha=2026-10-23`)
})

it('muestra el estado vacío del período consultado', async () => {
  abrir()
  await screen.findByRole('button', { name: 'Ver evento: Terapia ocupacional' })
  await userEvent.click(screen.getByRole('button', { name: 'Período siguiente' }))
  expect(await screen.findByText(/Todavía no hay eventos en este período/)).toBeInTheDocument()
})

it('muestra el error de acceso del backend sin exponer eventos', async () => {
  cliente.get.mockImplementation(async (ruta) => {
    if (ruta.endsWith('/eventos')) throw { response: { status: 403 } }
    if (ruta.endsWith('/miembros')) return { data: [] }
    return { data: { id: proyectoId, nombre: 'Niño ficticio' } }
  })
  abrir()
  expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso')
  expect(screen.queryByRole('button', { name: 'Ver evento: Terapia ocupacional' })).not.toBeInTheDocument()
})

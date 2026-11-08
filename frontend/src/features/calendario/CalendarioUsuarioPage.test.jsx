import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import { hoyIso } from '../../utils/fechas.js'
import { obtenerPeriodo, sumarDias, tituloDia } from './utils/periodo.js'
import CalendarioUsuarioPage from './CalendarioUsuarioPage.jsx'

vi.mock('../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() } }))

const hoy = hoyIso()
const proyectos = [{ id: 'proyecto-1', nombre: 'Acompañamiento Uno' }, { id: 'proyecto-2', nombre: 'Acompañamiento Dos' }]

function abrir() { render(<MemoryRouter><CalendarioUsuarioPage /></MemoryRouter>) }

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta === '/proyectos') return { data: proyectos }
    if (ruta.endsWith('/eventos')) return { data: [{ id: ruta.includes('proyecto-1') ? 'evento-1' : 'evento-2', proyectoId: ruta.includes('proyecto-1') ? 'proyecto-1' : 'proyecto-2', titulo: `Actividad ${ruta.includes('proyecto-1') ? 'Uno' : 'Dos'}`, fecha: hoy, fechaOcurrencia: hoy, horaInicio: '09:00:00', horaFin: '10:00:00', esCambio: false, recurrente: false }] }
    return { data: [] }
  })
  cliente.post.mockReset().mockResolvedValue({ data: { id: 'evento-nuevo' } })
})

it('abre el formulario con día y horario y crea el evento en el acompañamiento elegido', async () => {
  abrir()
  await screen.findByRole('button', { name: 'Ver evento: Actividad Uno' })
  const fecha = obtenerPeriodo('semana', hoy).desde
  const botonAgregar = screen.getAllByRole('button', { name: `Agregar evento el ${tituloDia(fecha)} a las 10:00` })[0]
  await userEvent.click(botonAgregar)
  const selector = await screen.findByRole('dialog', { name: '¿En qué acompañamiento va el evento?' })
  await userEvent.selectOptions(within(selector).getByLabelText('Acompañamiento'), 'proyecto-1')
  await userEvent.click(within(selector).getByRole('button', { name: 'Continuar' }))
  const formulario = await screen.findByRole('dialog', { name: 'Nuevo evento' })
  const [anio, mes, dia] = fecha.split('-')
  expect(within(formulario).getByLabelText('Fecha')).toHaveValue(`${dia}/${mes}/${anio}`)
  expect(within(formulario).getByLabelText('Hora de inicio')).toHaveValue('10:00')
  fireEvent.change(within(formulario).getByLabelText('Título'), { target: { value: 'Reunión escolar' } })
  await userEvent.click(within(formulario).getByRole('button', { name: 'Crear evento' }))
  await waitFor(() => expect(cliente.post).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos', expect.objectContaining({ titulo: 'Reunión escolar', horaInicio: '10:00' })))
})

it('carga y combina eventos reales de los proyectos del usuario en la semana por defecto', async () => {
  abrir()
  expect(await screen.findByRole('button', { name: 'Ver evento: Actividad Uno' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ver evento: Actividad Dos' })).toBeInTheDocument()
  expect(cliente.get).toHaveBeenCalledWith('/proyectos', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  const rango = obtenerPeriodo('semana', hoy)
  expect(cliente.get).toHaveBeenCalledWith('/proyectos/proyecto-1/eventos', expect.objectContaining({ params: { desde: rango.desde, hasta: rango.hasta } }))
  await userEvent.click(screen.getByRole('button', { name: 'Ver evento: Actividad Uno' }))
  expect(await screen.findByText('Acompañamiento: Acompañamiento Uno')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Editar Actividad Uno' })).not.toBeInTheDocument()
})

it('filtra por acompañamiento y actualiza el rango al elegir vista mensual', async () => {
  abrir()
  await screen.findByRole('button', { name: 'Ver evento: Actividad Uno' })
  await userEvent.selectOptions(screen.getByLabelText('Acompañamiento'), 'proyecto-2')
  expect(screen.queryByRole('button', { name: 'Ver evento: Actividad Uno' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ver evento: Actividad Dos' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Mensual' }))
  const rango = obtenerPeriodo('mes', hoy)
  await waitFor(() => expect(cliente.get).toHaveBeenCalledWith('/proyectos/proyecto-2/eventos', expect.objectContaining({ params: { desde: rango.desde, hasta: rango.hasta } })))
})

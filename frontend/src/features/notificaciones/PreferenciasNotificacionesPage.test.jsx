import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import { clienteApi } from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => {
  const cliente = {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    put: vi.fn(),
  }
  return { default: cliente, clienteApi: cliente }
})

const todas = [
  { tipo: 'CAMBIO_CALENDARIO', porEmail: true },
  { tipo: 'NOTA_NUEVA', porEmail: true },
  { tipo: 'MENCION', porEmail: false },
  { tipo: 'REVISION', porEmail: true },
  { tipo: 'CAMBIO_PAQUETE', porEmail: true },
]
const sesion = { usuario: { nombre: 'Tutora' }, estado: 'autenticado', cerrarSesion: vi.fn() }

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/cuenta/notificaciones']}>
      <AuthContext.Provider value={sesion}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  clienteApi.get.mockImplementation(async (ruta) => ({
    data: ruta === '/notificaciones/preferencias' ? todas : 0,
  }))
})

describe('6.1: avisos por mail', () => {
  it('muestra un interruptor por tipo con lo que guardó el usuario', async () => {
    abrir()
    const seccion = await screen.findByRole('region', { name: 'Avisos por mail' })
    const interruptores = within(seccion).getAllByRole('switch')
    expect(interruptores).toHaveLength(5)
    expect(within(seccion).getByRole('switch', { name: /Cambios en el calendario/ })).toBeChecked()
    expect(within(seccion).getByRole('switch', { name: /Notas nuevas/ })).toBeChecked()
    expect(within(seccion).getByRole('switch', { name: /Menciones/ })).not.toBeChecked()
    expect(within(seccion).getByRole('switch', { name: /Pedidos de revisión/ })).toBeChecked()
    expect(screen.getByText(/Las invitaciones a un acompañamiento siempre llegan por mail/)).toBeInTheDocument()
  })

  it('apagar un interruptor guarda solo ese tipo', async () => {
    clienteApi.put.mockResolvedValue({
      data: todas.map((item) => (item.tipo === 'NOTA_NUEVA' ? { ...item, porEmail: false } : item)),
    })
    abrir()
    const notas = await screen.findByRole('switch', { name: /Notas nuevas/ })
    await userEvent.click(notas)

    expect(clienteApi.put).toHaveBeenCalledExactlyOnceWith('/notificaciones/preferencias', [
      { tipo: 'NOTA_NUEVA', porEmail: false },
    ])
    expect(await screen.findByText('Guardamos tu preferencia.')).toBeInTheDocument()
    expect(notas).not.toBeChecked()
  })

  it('si no se puede guardar, vuelve el interruptor como estaba y avisa', async () => {
    clienteApi.put.mockRejectedValue({
      response: { data: { mensaje: 'No pudimos guardar' } },
    })
    abrir()
    const menciones = await screen.findByRole('switch', { name: /Menciones/ })
    await userEvent.click(menciones)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar')
    expect(menciones).not.toBeChecked()
  })

  it('no muestra tipos que el front no conoce', async () => {
    clienteApi.get.mockImplementation(async (ruta) => ({
      data:
        ruta === '/notificaciones/preferencias'
          ? [...todas, { tipo: 'NUEVO_TIPO', porEmail: true }]
          : 0,
    }))
    abrir()
    const seccion = await screen.findByRole('region', { name: 'Avisos por mail' })
    expect(within(seccion).getAllByRole('switch')).toHaveLength(5)
  })

  it('si falla la carga, permite reintentar', async () => {
    clienteApi.get.mockImplementation(async (ruta) => {
      if (ruta === '/notificaciones/preferencias') throw new Error('Sin conexión')
      return { data: 0 }
    })
    abrir()
    expect(await screen.findByText('No pudimos cargar tus preferencias.')).toBeInTheDocument()

    clienteApi.get.mockImplementation(async (ruta) => ({
      data: ruta === '/notificaciones/preferencias' ? todas : 0,
    }))
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('region', { name: 'Avisos por mail' })).toBeInTheDocument()
  })
})

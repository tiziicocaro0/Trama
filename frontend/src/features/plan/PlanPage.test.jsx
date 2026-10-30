import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const planes = [
  { periodo: 'MENSUAL', meses: 1, precioArs: 4500 },
  { periodo: 'SEMESTRAL', meses: 6, precioArs: 24000 },
]
const gratuito = {
  esProfesional: true,
  plan: 'GRATUITO',
  desde: null,
  hasta: null,
  proyectosGratuitos: 2,
  planes,
}
const mensual = { ...gratuito, plan: 'MENSUAL', desde: '2026-10-30', hasta: '2026-11-30' }
const sesion = { usuario: { nombre: 'Docente' }, estado: 'autenticado', cerrarSesion: vi.fn() }

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/cuenta/plan']}>
      <AuthContext.Provider value={sesion}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('9.1: Mi plan', () => {
  it('muestra al profesional su plan gratuito y los precios de la API', async () => {
    cliente.get.mockResolvedValue({ data: gratuito })
    abrir()
    expect(await screen.findByRole('heading', { name: 'Plan gratuito' })).toBeVisible()
    expect(screen.getByText(/Podés editar en tus 2 primeros niños/)).toBeVisible()
    expect(screen.getByText(/4\.500/)).toBeVisible()
    expect(screen.getByText(/24\.000/)).toBeVisible()
    expect(screen.getByText('por 6 meses')).toBeVisible()
  })

  it('a una familia no le muestra precios ni pagos', async () => {
    cliente.get.mockResolvedValue({ data: { ...gratuito, esProfesional: false } })
    abrir()
    expect(await screen.findByText('Trama es gratis para las familias, siempre.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Suscribirme' })).not.toBeInTheDocument()
    expect(screen.queryByText(/4\.500/)).not.toBeInTheDocument()
  })

  it('suscribirse pasa por el pago de prueba y activa el plan', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: gratuito })
    cliente.post.mockResolvedValue({ data: mensual })
    abrir()
    const botones = await screen.findAllByRole('button', { name: 'Suscribirme' })
    await user.click(botones[0])

    const pago = screen.getByRole('dialog', { name: 'Pago de prueba' })
    expect(within(pago).getByText(/no se cobra nada y no se guarda ninguna tarjeta/)).toBeVisible()
    expect(within(pago).getByText('Suscripción mensual')).toBeVisible()
    await user.click(within(pago).getByRole('button', { name: 'Confirmar pago de prueba' }))

    expect(cliente.post).toHaveBeenCalledWith('/suscripcion', { periodo: 'MENSUAL' })
    expect(await screen.findByText(/Tu suscripción está activa/)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Suscripción mensual' })).toBeVisible()
    expect(screen.getByText(/Vigente hasta el 30\/11\/2026/)).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si el pago de prueba falla, lo avisa sin cerrar la pantalla', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: gratuito })
    cliente.post.mockRejectedValue({ response: { data: { codigo: 'YA_SUSCRIPTO' } } })
    abrir()
    await user.click((await screen.findAllByRole('button', { name: 'Suscribirme' }))[1])
    await user.click(screen.getByRole('button', { name: 'Confirmar pago de prueba' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya tenés una suscripción activa.')
    expect(screen.getByRole('dialog', { name: 'Pago de prueba' })).toBeVisible()
  })

  it('cancelar la suscripción vuelve al plan gratuito', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: mensual })
    cliente.delete.mockResolvedValue({ data: gratuito })
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Cancelar suscripción' }))
    await user.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(cliente.delete).toHaveBeenCalledWith('/suscripcion')
    expect(await screen.findByText(/Volviste al plan gratuito/)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Plan gratuito' })).toBeVisible()
  })

  it('el menú lateral marca «Mi plan» como página actual', async () => {
    cliente.get.mockResolvedValue({ data: gratuito })
    abrir()
    await screen.findByRole('heading', { name: 'Plan gratuito' })
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: 'Mi plan' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getAllByRole('link', { current: 'page' })).toHaveLength(1)
  })
})

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

const paquetes = [
  { id: 'p-inicial', nombre: 'Inicial', cupoNinos: 15, cupoProfesionales: 5, precioArs: 18000 },
  { id: 'p-intermedio', nombre: 'Intermedio', cupoNinos: 40, cupoProfesionales: 15, precioArs: 45000 },
  { id: 'p-red', nombre: 'Red', cupoNinos: null, cupoProfesionales: null, precioArs: 90000 },
]
const institucion = {
  id: 'i-1',
  nombre: 'Escuela Ficticia',
  paquete: paquetes[0],
  ninosUsados: 0,
  profesionalesUsados: 0,
  profesionales: [],
}
const conProfesional = {
  ...institucion,
  ninosUsados: 3,
  profesionalesUsados: 1,
  profesionales: [
    { licenciaId: 'l-1', nombre: 'Docente', apellido: 'Ficticia', email: 'docente@example.com', desde: '2026-10-30' },
  ],
}
const sesion = { usuario: { nombre: 'Responsable' }, estado: 'autenticado', cerrarSesion: vi.fn() }

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/institucion']}>
      <AuthContext.Provider value={sesion}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('9.2: paquete institucional', () => {
  it('sin institución muestra los paquetes con sus cupos y precios', async () => {
    cliente.get.mockResolvedValue({ data: { institucion: null, paquetes } })
    abrir()
    expect(await screen.findByRole('heading', { name: 'Inicial' })).toBeVisible()
    expect(screen.getByText('15 niños')).toBeVisible()
    expect(screen.getByText('5 profesionales')).toBeVisible()
    expect(screen.getByText('niños sin límite')).toBeVisible()
    expect(screen.getByText(/90\.000/)).toBeVisible()
  })

  it('pide el nombre antes de pasar al pago', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: { institucion: null, paquetes } })
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Contratar Inicial' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresá el nombre de la institución')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('contrata un paquete con el pago de prueba', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: { institucion: null, paquetes } })
    cliente.post.mockResolvedValue({ data: institucion })
    abrir()
    await user.type(await screen.findByLabelText('Nombre de la institución'), 'Escuela Ficticia')
    await user.click(screen.getByRole('button', { name: 'Contratar Inicial' }))
    const pago = screen.getByRole('dialog', { name: 'Pago de prueba' })
    expect(within(pago).getByText('Paquete Inicial · Escuela Ficticia')).toBeVisible()
    await user.click(within(pago).getByRole('button', { name: 'Confirmar pago de prueba' }))

    expect(cliente.post).toHaveBeenCalledWith('/institucion', {
      nombre: 'Escuela Ficticia',
      paqueteId: 'p-inicial',
    })
    expect(await screen.findByRole('heading', { name: 'Escuela Ficticia · Paquete Inicial' })).toBeVisible()
    expect(screen.getByText('0 de 15')).toBeVisible()
  })

  it('asocia un profesional por email y actualiza los cupos', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: { institucion, paquetes } })
    cliente.post.mockResolvedValue({ data: conProfesional })
    abrir()
    await user.type(await screen.findByLabelText('Email del profesional'), ' Docente@Example.com ')
    await user.click(screen.getByRole('button', { name: 'Asociar' }))
    expect(cliente.post).toHaveBeenCalledWith('/institucion/profesionales', {
      email: 'docente@example.com',
    })
    expect(await screen.findByText('docente@example.com')).toBeVisible()
    expect(screen.getByText('3 de 15')).toBeVisible()
    expect(screen.getByText('1 de 5')).toBeVisible()
  })

  it('muestra un error claro si el email no tiene cuenta', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: { institucion, paquetes } })
    cliente.post.mockRejectedValue({ response: { data: { codigo: 'EMAIL_NO_REGISTRADO' } } })
    abrir()
    await user.type(await screen.findByLabelText('Email del profesional'), 'nadie@example.com')
    await user.click(screen.getByRole('button', { name: 'Asociar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ese email no está registrado en Trama: pedile que cree su cuenta primero.',
    )
  })

  it('quita a un profesional asociado', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: { institucion: conProfesional, paquetes } })
    cliente.delete.mockResolvedValue({ data: institucion })
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Quitar a Docente Ficticia' }))
    expect(cliente.delete).toHaveBeenCalledWith('/institucion/profesionales/l-1')
    expect(await screen.findByText('Todavía no asociaste profesionales.')).toBeVisible()
  })

  it('le aclara al responsable que no ve perfiles de niños', async () => {
    cliente.get.mockResolvedValue({ data: { institucion, paquetes } })
    abrir()
    expect(await screen.findByText(/no ves los perfiles de los niños/)).toBeVisible()
  })
})

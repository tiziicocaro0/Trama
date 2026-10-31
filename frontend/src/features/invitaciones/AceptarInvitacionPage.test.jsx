import { render, screen, waitFor } from '@testing-library/react'
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
  },
}))

const PROYECTO = '3f2b1c4d-0000-4000-8000-000000000001'
const detalle = (rol) => ({
  proyectoId: PROYECTO,
  nombreProyecto: 'Tomás',
  nombreInvitador: 'Marta',
  rol,
  venceEn: '2026-11-06T10:00:00Z',
})
const terapeuta = {
  nombre: 'Sofía',
  email: 'terapeuta@trama.test',
  tipoCuenta: 'PROFESIONAL',
  especialidades: ['TERAPIA_OCUPACIONAL', 'DOCENTE_PRIMARIO'],
}

function abrir(usuario, ruta = '/invitaciones/token-ficticio') {
  const sesion = {
    usuario,
    estado: usuario ? 'autenticado' : 'anonimo',
    cerrarSesion: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={sesion}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('1.4 y 9.4: aceptar una invitación', () => {
  it('sin sesión muestra quién invita y con qué rol, y recuerda volver después de ingresar', async () => {
    cliente.get.mockResolvedValue({ data: detalle('SALUD') })
    abrir(null)
    expect(
      await screen.findByRole('heading', { name: 'Te invitaron a la red de Tomás' }),
    ).toBeVisible()
    expect(screen.getByText('profesional de salud')).toBeVisible()
    expect(cliente.get).toHaveBeenCalledWith('/invitaciones/token-ficticio', expect.anything())
    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro')
    expect(sessionStorage.getItem('trama.invitacionPendiente')).toBe('/invitaciones/token-ficticio')
  })

  it('al ingresar con una invitación pendiente vuelve a ella en lugar de ir al inicio', async () => {
    sessionStorage.setItem('trama.invitacionPendiente', '/invitaciones/token-ficticio')
    cliente.get.mockResolvedValue({ data: detalle('FAMILIAR') })
    abrir(terapeuta, '/login')
    expect(
      await screen.findByRole('heading', { name: 'Te invitaron a la red de Tomás' }),
    ).toBeVisible()
    expect(sessionStorage.getItem('trama.invitacionPendiente')).toBeNull()
  })

  it('al profesional le precarga solo las especialidades de su cuenta que van con el rol', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: detalle('SALUD') })
    cliente.post.mockResolvedValue({ data: { rol: 'SALUD' } })
    abrir(terapeuta)

    const terapia = await screen.findByRole('checkbox', { name: 'Terapia ocupacional' })
    expect(terapia).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Psicología' })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Docente primario' })).not.toBeInTheDocument()
    expect(screen.queryByText('Educación')).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Fonoaudiología' }))
    await user.click(screen.getByRole('button', { name: 'Unirme a la red' }))

    expect(cliente.post).toHaveBeenCalledWith('/invitaciones/token-ficticio/aceptar', {
      especialidades: ['TERAPIA_OCUPACIONAL', 'FONOAUDIOLOGIA'],
    })
    // Después de sumarse va al perfil del niño
    await waitFor(() =>
      expect(cliente.get.mock.calls.some(([url]) => url.includes(PROYECTO))).toBe(true),
    )
  })

  it('un familiar se suma sin elegir especialidades', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: detalle('FAMILIAR') })
    cliente.post.mockResolvedValue({ data: { rol: 'FAMILIAR' } })
    abrir(terapeuta)
    await user.click(await screen.findByRole('button', { name: 'Unirme a la red' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(cliente.post).toHaveBeenCalledWith('/invitaciones/token-ficticio/aceptar', {
      especialidades: [],
    })
  })

  it('si ya es miembro lo dice y ofrece ir al acompañamiento', async () => {
    const user = userEvent.setup()
    cliente.get.mockResolvedValue({ data: detalle('FAMILIAR') })
    cliente.post.mockRejectedValue({ response: { status: 409, data: { codigo: 'YA_ES_MIEMBRO' } } })
    abrir(terapeuta)
    await user.click(await screen.findByRole('button', { name: 'Unirme a la red' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya formás parte de este acompañamiento.')
    expect(screen.getByRole('link', { name: 'Ir al acompañamiento' })).toHaveAttribute(
      'href',
      `/proyectos/${PROYECTO}`,
    )
  })

  it('una invitación vencida muestra un mensaje claro', async () => {
    cliente.get.mockRejectedValue({ response: { status: 410, data: { codigo: 'INVITACION_NO_DISPONIBLE' } } })
    abrir(null)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta invitación venció o ya se usó.',
    )
  })
})

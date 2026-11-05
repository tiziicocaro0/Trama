import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PanelPage from './PanelPage.jsx'

vi.mock('../../hooks/useAuth.js', () => ({
  default: () => ({
    usuario: { id: 'prof-1', nombre: 'Laura', tipoCuenta: 'PROFESIONAL' },
    cerrarSesion: vi.fn(),
  }),
  useAuth: () => ({
    usuario: { id: 'prof-1', nombre: 'Laura', tipoCuenta: 'PROFESIONAL' },
    cerrarSesion: vi.fn(),
  }),
}))

const mockUsePanel = vi.fn()
vi.mock('./hooks/usePanel.js', () => ({
  default: () => mockUsePanel(),
}))

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/panel']}>
      <PanelPage />
    </MemoryRouter>,
  )
}

describe('PanelPage (7.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra estado de carga mientras consulta el panel', () => {
    mockUsePanel.mockReturnValue({
      ninos: null,
      error: null,
      noAutorizado: false,
      cargando: true,
      reintentar: vi.fn(),
    })

    renderizar()
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando tu panel/i)
  })

  it('muestra mensaje accesible cuando el usuario no es profesional (403)', () => {
    mockUsePanel.mockReturnValue({
      ninos: null,
      error: 'Esta sección es exclusiva para profesionales de educación o salud.',
      noAutorizado: true,
      cargando: false,
      reintentar: vi.fn(),
    })

    renderizar()
    expect(
      screen.getByRole('heading', { name: /Acceso exclusivo para profesionales/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Ir a acompañamientos/i }),
    ).toHaveAttribute('href', '/acompanamientos')
  })

  it('muestra mensaje de error y permite reintentar', async () => {
    const reintentar = vi.fn()
    mockUsePanel.mockReturnValue({
      ninos: null,
      error: 'Error de conexión',
      noAutorizado: false,
      cargando: false,
      reintentar,
    })

    renderizar()
    expect(screen.getByRole('alert')).toHaveTextContent('Error de conexión')
    const boton = screen.getByRole('button', { name: /Reintentar/i })
    await userEvent.click(boton)
    expect(reintentar).toHaveBeenCalledTimes(1)
  })

  it('muestra estado vacío cuando el profesional no tiene niños asignados', () => {
    mockUsePanel.mockReturnValue({
      ninos: [],
      error: null,
      noAutorizado: false,
      cargando: false,
      reintentar: vi.fn(),
    })

    renderizar()
    expect(
      screen.getByRole('heading', { name: /Todavía no tenés niños asignados/i }),
    ).toBeInTheDocument()
  })

  it('muestra la lista de niños con novedades, estado de solo lectura y link a la portada', () => {
    const mockNinos = [
      {
        id: 'p-1',
        proyectoId: 'p-1',
        nombre: 'Tomás',
        apellido: 'Pérez',
        fechaNacimiento: '2018-05-12',
        rol: 'EDUCACION',
        aportesNuevos: 2,
        eventosNuevos: 1,
        totalNovedades: 3,
        soloLectura: false,
      },
      {
        id: 'p-2',
        proyectoId: 'p-2',
        nombre: 'Martina',
        apellido: 'Gómez',
        fechaNacimiento: '2019-08-20',
        rol: 'SALUD',
        aportesNuevos: 0,
        eventosNuevos: 0,
        totalNovedades: 0,
        soloLectura: true,
      },
    ]

    mockUsePanel.mockReturnValue({
      ninos: mockNinos,
      error: null,
      noAutorizado: false,
      cargando: false,
      reintentar: vi.fn(),
    })

    renderizar()

    // Encabezado principal
    expect(
      screen.getByRole('heading', { level: 1, name: /Panel de profesionales/i }),
    ).toBeInTheDocument()

    // Niño 1: Tomás
    expect(screen.getByRole('heading', { level: 2, name: 'Tomás' })).toBeInTheDocument()
    expect(screen.getByText('Educación')).toBeInTheDocument()
    expect(screen.getByText(/3 novedades en los últimos 7 días/i)).toBeInTheDocument()
    expect(screen.getByText(/\(2 aportes, 1 evento\)/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver perfil de Tomás/i })).toHaveAttribute(
      'href',
      '/proyectos/p-1',
    )

    // Niño 2: Martina con Solo lectura
    expect(screen.getByRole('heading', { level: 2, name: 'Martina' })).toBeInTheDocument()
    expect(screen.getByText('Salud')).toBeInTheDocument()
    expect(screen.getByText(/Sin novedades esta semana/i)).toBeInTheDocument()
    expect(screen.getByText(/Solo lectura/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver perfil de Martina/i })).toHaveAttribute(
      'href',
      '/proyectos/p-2',
    )
  })

  it('permite filtrar niños por nombre con el buscador', async () => {
    const mockNinos = [
      {
        id: 'p-1',
        proyectoId: 'p-1',
        nombre: 'Tomás',
        fechaNacimiento: '2018-05-12',
        rol: 'EDUCACION',
        totalNovedades: 1,
        aportesNuevos: 1,
        eventosNuevos: 0,
        soloLectura: false,
      },
      {
        id: 'p-2',
        proyectoId: 'p-2',
        nombre: 'Martina',
        fechaNacimiento: '2019-08-20',
        rol: 'SALUD',
        totalNovedades: 0,
        aportesNuevos: 0,
        eventosNuevos: 0,
        soloLectura: false,
      },
    ]

    mockUsePanel.mockReturnValue({
      ninos: mockNinos,
      error: null,
      noAutorizado: false,
      cargando: false,
      reintentar: vi.fn(),
    })

    renderizar()

    const input = screen.getByRole('searchbox', { name: /Buscar niño/i })
    await userEvent.type(input, 'Tom')

    expect(screen.getByRole('heading', { level: 2, name: 'Tomás' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Martina' })).not.toBeInTheDocument()

    // Búsqueda sin coincidencias
    await userEvent.clear(input)
    await userEvent.type(input, 'Inexistente')
    expect(
      screen.getByText(/No encontramos niños con ese nombre/i),
    ).toBeInTheDocument()
  })
})


import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn() },
}))
const id = '0f8b4fc3-e754-4707-8769-28d7210de226'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }
const red = [
  {
    id: 'membresia-tutora',
    nombre: 'Tutora ficticia',
    apellido: 'Ejemplo',
    rol: 'TUTOR',
    esAdmin: true,
    especialidades: [],
  },
  {
    id: 'membresia-familiar',
    nombre: 'Familiar ficticio',
    apellido: 'Ejemplo',
    rol: 'FAMILIAR',
    esAdmin: false,
    especialidades: [],
  },
  {
    id: 'membresia-ejemplo',
    nombre: 'Docente ficticia',
    apellido: 'Ejemplo',
    rol: 'EDUCACION',
    especialidades: [{ especialidad: 'DOCENTE_PRIMARIO', aclaracion: null }],
  },
]
function abrir(ruta = `/proyectos/${id}/red`, autenticar = true) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider
        value={{
          usuario: autenticar ? { nombre: 'Tutora' } : null,
          estado: autenticar ? 'autenticado' : 'anonimo',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/miembros')
      ? red
      : ruta.endsWith('/aportes')
        ? []
        : { ...proyecto, puedeCargar: true },
  }))
})
describe('Red de profesionales', () => {
  it('abre Red desde el perfil y muestra las membresías reales', async () => {
    abrir(`/proyectos/${id}`)
    await userEvent.click(
      await screen.findByRole('link', { name: 'Red', exact: true }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Docente ficticia Ejemplo' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Educación')).toBeInTheDocument()
    expect(screen.getByText('Docente primario')).toBeInTheDocument()
    expect(document.title).toBe('TRAMA · Red')
    await userEvent.click(
      screen.getByRole('link', { name: 'Volver al perfil' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Fortalezas' }),
    ).toBeInTheDocument()
  })
  it('muestra a todos los miembros con su rol y marca al administrador', async () => {
    abrir()
    expect(
      await screen.findByRole('heading', { name: 'Tutora ficticia Ejemplo' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tutor/a · Administrador')).toBeInTheDocument()
    expect(screen.getByText('Familiar')).toBeInTheDocument()
    // La especialidad solo aplica a Educación y Salud
    expect(screen.queryAllByText(/Especialidad no informada/)).toHaveLength(0)
  })
  it('muestra estado vacío y un dato faltante sin inventar profesionales', async () => {
    cliente.get.mockImplementation(async (ruta) => ({
      data: ruta.endsWith('/miembros') ? [] : proyecto,
    }))
    abrir()
    expect(
      await screen.findByText(
        'Todavía no hay miembros en esta red.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Docente ficticia')).not.toBeInTheDocument()
  })
  it('indica cuando la especialidad no está informada', async () => {
    cliente.get.mockImplementation(async (ruta) => ({
      data: ruta.endsWith('/miembros')
        ? [{ ...red[2], especialidades: [] }]
        : proyecto,
    }))
    abrir()
    expect(
      await screen.findByText('Especialidad no informada'),
    ).toBeInTheDocument()
  })
  it('no muestra profesionales si el servidor rechaza el acceso', async () => {
    cliente.get.mockRejectedValue({ response: { status: 403 } })
    abrir()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso',
    )
    expect(
      screen.queryByText('Docente ficticia Ejemplo'),
    ).not.toBeInTheDocument()
  })
  it('protege el acceso a la red sin sesión', () => {
    abrir(undefined, false)
    expect(
      screen.getByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(cliente.get).not.toHaveBeenCalled()
  })
})

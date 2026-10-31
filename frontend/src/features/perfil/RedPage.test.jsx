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
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
const id = '0f8b4fc3-e754-4707-8769-28d7210de226'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }
const red = [
  {
    id: 'membresia-tutora',
    usuarioId: 'usuario-tutora',
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
function abrir(
  ruta = `/proyectos/${id}/red`,
  autenticar = true,
  usuarioExtra = {},
) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider
        value={{
          usuario: autenticar ? { nombre: 'Tutora', ...usuarioExtra } : null,
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
  cliente.post.mockReset()
  cliente.put.mockReset()
  cliente.delete.mockReset()
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
      await screen.findByText('Todavía no hay miembros en esta red.'),
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
  it('permite al tutor administrador invitar a un co-tutor desde el modal', async () => {
    cliente.post.mockResolvedValue({
      data: {
        id: 'inv-1',
        email: 'cotutor@ejemplo.test',
        rol: 'TUTOR',
        estado: 'PENDIENTE',
      },
    })
    abrir(undefined, true, { esAdmin: true })

    const botonInvitar = await screen.findByRole('button', {
      name: 'Invitar miembro',
    })
    await userEvent.click(botonInvitar)

    expect(
      screen.getByRole('option', { name: 'Co-tutor (otro tutor legal)' }),
    ).toBeInTheDocument()

    await userEvent.type(
      screen.getByLabelText('Correo electrónico'),
      'cotutor@ejemplo.test',
    )
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'TUTOR')
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar invitación' }),
    )

    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${id}/invitaciones`,
      { email: 'cotutor@ejemplo.test', rol: 'TUTOR' },
    )
    expect(
      await screen.findByText('Invitación enviada correctamente.'),
    ).toBeInTheDocument()
  })
  it('permite al tutor administrador convertir a un familiar en co-tutor', async () => {
    cliente.put.mockResolvedValue({
      data: {
        ...red[1],
        rol: 'TUTOR',
        esAdmin: true,
      },
    })
    abrir(undefined, true, { esAdmin: true })

    const botonesCoTutor = await screen.findAllByRole('button', {
      name: 'Hacer co-tutor',
    })
    expect(botonesCoTutor).toHaveLength(1)

    await userEvent.click(botonesCoTutor[0])

    expect(cliente.put).toHaveBeenCalledWith(
      `/proyectos/${id}/miembros/membresia-familiar/co-tutor`,
    )
    expect(await screen.findAllByText('Tutor/a · Administrador')).toHaveLength(
      2,
    )
    expect(
      screen.queryByRole('button', { name: 'Hacer co-tutor' }),
    ).not.toBeInTheDocument()
  })
  it('abre el modal de invitar al llegar desde el menú con ?invitar=1', async () => {
    abrir(`/proyectos/${id}/red?invitar=1`, true, { esAdmin: true })

    expect(
      await screen.findByRole('option', { name: 'Co-tutor (otro tutor legal)' }),
    ).toBeInTheDocument()
  })
  it('no abre el modal de invitar con ?invitar=1 si el usuario no es administrador', async () => {
    abrir(`/proyectos/${id}/red?invitar=1`, true, { esAdmin: false })

    expect(
      await screen.findByRole('heading', { name: 'Tutora ficticia Ejemplo' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument()
  })
  it('quita el acceso con confirmación usando el endpoint de miembros', async () => {
    cliente.delete.mockResolvedValue({})
    abrir(undefined, true, { esAdmin: true })

    const botonQuitar = await screen.findByRole('button', {
      name: 'Quitar acceso a Familiar ficticio Ejemplo',
    })
    expect(botonQuitar).toHaveClass('bg-error')
    await userEvent.click(botonQuitar)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(cliente.delete).toHaveBeenCalledWith(
      `/proyectos/${id}/miembros/membresia-familiar`,
    )
    expect(
      screen.queryByRole('heading', { name: 'Familiar ficticio Ejemplo' }),
    ).not.toBeInTheDocument()
  })
  it('nadie ve el botón para quitarse el acceso a sí mismo', async () => {
    abrir(undefined, true, { id: 'usuario-tutora', esAdmin: true })
    expect(
      await screen.findByRole('button', { name: 'Quitar acceso a Familiar ficticio Ejemplo' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Quitar acceso a Tutora ficticia Ejemplo' }),
    ).not.toBeInTheDocument()
  })
  it('tiene la navegación principal a un clic', async () => {
    abrir()
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' })
    for (const [nombre, destino] of [
      ['Inicio', '/inicio'],
      ['Acompañamientos', '/acompanamientos'],
      ['Recursos', '/inicio?seccion=recursos'],
      ['Mi plan', '/cuenta/plan'],
    ]) {
      expect(within(nav).getByRole('link', { name: nombre })).toHaveAttribute('href', destino)
    }
    expect(within(nav).getByRole('link', { name: 'Acompañamientos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

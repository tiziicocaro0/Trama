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
  },
}))

const id = '1b6e2c7d-3f4a-4d9b-8e2f-6a5c4b3d2e1f'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }
const aporte = {
  id: 'aporte-ficticio',
  tipo: 'FORTALEZA',
  titulo: 'Arma rompecabezas',
  contenido: 'De 100 piezas',
  datos: '{"contexto":"CASA"}',
  visibilidad: 'TODOS',
  puedeEditar: false,
}
const versiones = [
  {
    numero: 2,
    actual: true,
    titulo: 'Arma rompecabezas',
    contenido: 'De 100 piezas',
    autorNombre: 'Marta Fernández',
    fechaCreacion: '2026-10-21T12:00:00Z',
    fechaModificacion: null,
  },
  {
    numero: 1,
    actual: false,
    titulo: 'Arma rompecabezas chicos',
    contenido: 'De 20 piezas',
    autorNombre: 'Marta Fernández',
    fechaCreacion: '2026-10-20T12:00:00Z',
    fechaModificacion: '2026-10-21T12:00:00Z',
  },
]

function abrir() {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/fortalezas`]}>
      <AuthContext.Provider
        value={{ usuario: { nombre: 'Usuario ficticio' }, estado: 'autenticado' }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta.endsWith('/versiones')) return { data: versiones }
    if (ruta.endsWith('/aportes')) return { data: [aporte] }
    return { data: { ...proyecto, puedeCargar: true } }
  })
})

describe('Historial de versiones (3.2)', () => {
  it('cualquier miembro abre el historial y ve las versiones con fecha, autor y contenido', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Ver historial del aporte: Arma rompecabezas',
      }),
    )

    const dialogo = await screen.findByRole('dialog')
    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${id}/aportes/aporte-ficticio/versiones`,
    )
    const lista = within(dialogo).getByRole('list', {
      name: 'Versiones del aporte',
    })
    const items = within(lista).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Versión 2 · actual')).toBeInTheDocument()
    expect(within(items[1]).getByText('Arma rompecabezas chicos')).toBeInTheDocument()
    expect(within(items[1]).getByText('De 20 piezas')).toBeInTheDocument()
    expect(within(items[1]).getByText(/Marta Fernández/)).toBeInTheDocument()
    expect(items[1].querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-20T12:00:00Z',
    )
    // Las versiones son de solo lectura: no hay botones para editarlas
    expect(within(dialogo).queryByRole('button', { name: /Editar/ })).toBeNull()
  })

  it('al cerrar el historial el foco vuelve al botón', async () => {
    abrir()
    const boton = await screen.findByRole('button', {
      name: 'Ver historial del aporte: Arma rompecabezas',
    })
    await userEvent.click(boton)
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(boton).toHaveFocus()
  })

  it('muestra un error claro si no puede cargar el historial', async () => {
    cliente.get.mockImplementation(async (ruta) => {
      if (ruta.endsWith('/versiones')) throw { response: { status: 403 } }
      if (ruta.endsWith('/aportes')) return { data: [aporte] }
      return { data: { ...proyecto, puedeCargar: true } }
    })
    abrir()
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Ver historial del aporte: Arma rompecabezas',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver el historial de este aporte.',
    )
  })
})

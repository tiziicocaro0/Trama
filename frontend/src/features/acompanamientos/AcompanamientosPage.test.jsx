import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn() },
}))

const id = 'a3298b67-5c39-41f8-9051-8c495d56a8ff'
const otroId = 'fa407232-3c46-41cb-901c-3a132467646d'
const proyectos = [
  { id, nombre: 'Luz ficticia' },
  { id: otroId, nombre: 'Río ficticio' },
]
const miembros = [
  {
    id: 'miembro-ficticio',
    usuarioId: 'autor-ficticio',
    nombre: 'María',
    apellido: 'Díaz',
    rol: 'EDUCACION',
  },
]
const detalles = {
  [id]: { ...proyectos[0], fechaNacimiento: '2017-05-12' },
  [otroId]: { ...proyectos[1], fechaNacimiento: '2018-09-03' },
}
const sesion = {
  usuario: { nombre: 'Tutora ficticia' },
  estado: 'autenticado',
  cerrarSesion: vi.fn(),
}

function abrir(ruta = '/acompanamientos', auth = sesion) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={auth}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.defaults.baseURL = '/api'

  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta === '/proyectos') {
      return { data: proyectos }
    }

    if (ruta.endsWith('/aportes')) {
      return { data: [] }
    }

    if (ruta.endsWith('/miembros')) {
      return { data: miembros }
    }

    return {
      data: detalles[ruta.split('/').at(-1)],
    }
  })
})

describe('Recorrido Dashboard → Acompañamientos → Perfil', () => {
  it.each(['Acompañamientos', 'Ver todos los acompañamientos'])(
    'permite recorrer el flujo desde %s y volver',
    async (entrada) => {
      const user = userEvent.setup()
      abrir('/inicio')
      await user.click(screen.getByRole('link', { name: entrada, exact: true }))
      expect(
        await screen.findByRole('heading', { name: 'Luz ficticia' }),
      ).toBeInTheDocument()
      expect(document.title).toBe('TRAMA · Acompañamientos')
      expect(cliente.get).toHaveBeenCalledWith('/proyectos', {
        signal: expect.any(AbortSignal),
      })
      const tarjeta = screen.getByRole('link', {
        name: 'Ver perfil de Luz ficticia',
      })
      expect(tarjeta).toHaveAttribute('href', `/proyectos/${id}`)
      expect(within(tarjeta).getByRole('img')).toHaveAccessibleName(
        'Foto de Luz ficticia no disponible',
      )
      expect(tarjeta).toHaveTextContent(
        `${new Date().getFullYear() - 2017 - (new Date() < new Date(new Date().getFullYear(), 4, 12) ? 1 : 0)} años`,
      )
      tarjeta.focus()
      await user.keyboard('{Enter}')
      expect(
        await screen.findByRole('heading', { name: 'Fortalezas' }),
      ).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /^Ver todo:/ })).toHaveLength(
        6,
      )
      await user.click(
        screen.getByRole('link', { name: 'Ver todo: Intereses' }),
      )
      expect(
        await screen.findByRole('heading', { name: 'Intereses', level: 2 }),
      ).toBeInTheDocument()
      await user.click(
        screen.getAllByRole('link', { name: 'Volver al perfil' })[0],
      )
      await screen.findByRole('heading', { name: 'Rutinas' })
      await user.click(
        screen.getByRole('link', { name: 'Volver a acompañamientos' }),
      )
      expect(
        await screen.findByRole('link', { name: 'Ver perfil de Luz ficticia' }),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Volver al inicio' }))
      expect(
        screen.getByRole('heading', { name: 'Acompañamientos activos' }),
      ).toBeInTheDocument()
    },
  )

  it('busca por nombre sin inventar proyectos y permite limpiar la búsqueda', async () => {
    const user = userEvent.setup()
    abrir()
    const buscar = await screen.findByRole('searchbox', {
      name: 'Buscar acompañamiento',
    })
    await user.type(buscar, 'luz')
    expect(
      screen.getByRole('link', { name: 'Ver perfil de Luz ficticia' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Ver perfil de Río ficticio' }),
    ).not.toBeInTheDocument()
    await user.clear(buscar)
    await user.type(buscar, 'Sin coincidencias')
    expect(screen.getByRole('status')).toHaveTextContent(
      'No encontramos acompañamientos con ese nombre',
    )
    await user.clear(buscar)
    expect(
      screen.getAllByRole('link', { name: /^Ver perfil de/ }),
    ).toHaveLength(2)
  })

  it('protege el acceso directo sin una sesión', () => {
    abrir('/acompanamientos', { usuario: null, estado: 'anonimo' })
    expect(
      screen.getByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(cliente.get).not.toHaveBeenCalled()
  })
})

describe('Estados y datos de Acompañamientos', () => {
  it('muestra carga y después una lista vacía sin consultar detalles', async () => {
    cliente.get.mockResolvedValue({ data: [] })
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Cargando tus acompañamientos',
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Todavía no tenés acompañamientos',
      }),
    ).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('link', { name: /^Ver perfil de/ }),
    ).not.toBeInTheDocument()
  })

  it.each([undefined, 401, 403, 500])(
    'muestra error sin reemplazar datos por ejemplos: %s',
    async (status) => {
      cliente.get.mockRejectedValue({
        response: status ? { status } : undefined,
      })
      abrir()
      await screen.findByRole('alert')
      expect(
        screen.queryByRole('link', { name: /^Ver perfil de/ }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Tomás')).not.toBeInTheDocument()
      expect(screen.queryByText(/Todavía no tenés/)).not.toBeInTheDocument()
    },
  )

  it('recupera la lista al reintentar un error de conexión', async () => {
    cliente.get.mockRejectedValueOnce(new Error('Sin conexión'))
    abrir()
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('link', { name: 'Ver perfil de Luz ficticia' }),
    ).toBeInTheDocument()
  })

  it('no inventa edades cuando falla el detalle de un proyecto', async () => {
    cliente.get
      .mockResolvedValueOnce({ data: proyectos })
      .mockRejectedValueOnce(new Error('Sin detalle'))
    abrir()
    await screen.findByRole('alert')
    expect(
      screen.queryByRole('link', { name: /^Ver perfil de/ }),
    ).not.toBeInTheDocument()
  })

  it.each([null, {}, [{ id }], [{ nombre: 'Sin identificador' }]])(
    'rechaza un listado inválido: %j',
    async (data) => {
      cliente.get.mockResolvedValue({ data })
      abrir()
      await screen.findByRole('alert')
      expect(cliente.get).toHaveBeenCalledTimes(1)
    },
  )

  it('no consulta una URL relativa si falta configurar la API', async () => {
    cliente.defaults.baseURL = ''
    abrir()
    await screen.findByRole('alert')
    expect(cliente.get).not.toHaveBeenCalled()
  })

  it('cancela la carga al salir e ignora respuestas tardías', async () => {
    let resolver
    cliente.get.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )
    const vista = abrir()
    const signal = cliente.get.mock.calls[0][1].signal
    vista.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => resolver({ data: proyectos }))
    expect(cliente.get).toHaveBeenCalledTimes(1)
  })
})

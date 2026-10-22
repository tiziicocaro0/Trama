import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'
import usePerfil from './hooks/usePerfil.js'
import { obtenerAportesEjemplo } from './perfil.mock.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn() },
}))

const id = '83b10b1d-36dc-4c54-a07b-4e83f527189a'
const proyecto = {
  id,
  nombre: 'Niño de ejemplo',
  fechaNacimiento: '2017-05-12',
}
const aportes = [
  'FORTALEZA',
  'INTERES',
  'COMUNICACION',
  'SENSORIAL',
  'ESTRATEGIA',
  'RUTINA',
].flatMap((tipo) =>
  obtenerAportesEjemplo(tipo).map((aporte) => ({
    ...aporte,
    tipo,
    contenido: null,
    visibilidad: 'TODOS',
    puedeEditar: true,
  })),
)
const sesion = {
  usuario: { nombre: 'Tutora' },
  estado: 'autenticado',
  cerrarSesion: vi.fn(),
}

function abrir(ruta = `/proyectos/${id}`, auth = sesion) {
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
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/aportes')
      ? aportes
      : { ...proyecto, puedeCargar: true },
  }))
})

describe('Portada y navegación de lectura', () => {
  it('consulta el proyecto real, muestra seis bloques y limita a tres aportes', async () => {
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando el perfil')
    await screen.findByRole('heading', { name: proyecto.nombre, level: 1 })
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${id}`, {
      signal: expect.any(AbortSignal),
    })
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((nodo) => nodo.textContent),
    ).toEqual([
      'Fortalezas',
      'Intereses',
      'Comunicación',
      'Perfil sensorial',
      'Estrategias',
      'Rutinas',
    ])
    const fortalezas = screen.getByRole('region', { name: 'Fortalezas' })
    expect(within(fortalezas).getAllByRole('article')).toHaveLength(3)
    expect(
      screen.queryByText('Disfruta resolver desafíos'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/son ficticios y no pertenecen/),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Foto de .* no disponible/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('¡Sumá el primero!', { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: /Si se desregula/ }),
    ).toHaveTextContent('Próximamente')
    expect(
      screen.queryByRole('button', { name: 'Si se desregula' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Ver todo:/ })).toHaveLength(6)
    expect(document.title).toBe('TRAMA · Perfil del niño')
  })

  it('abre todos los aportes recibidos del servidor con un clic y permite volver', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(
      await screen.findByRole('link', { name: 'Ver todo: Fortalezas' }),
    )
    expect(
      await screen.findByText('Disfruta resolver desafíos'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(
      screen.queryByRole('heading', { name: 'Intereses' }),
    ).not.toBeInTheDocument()
    expect(document.title).toBe('TRAMA · Fortalezas')
    await user.click(
      screen.getAllByRole('link', { name: 'Volver al perfil' })[0],
    )
    expect(
      await screen.findByRole('heading', { name: 'Intereses' }),
    ).toBeInTheDocument()
  })

  it.each([
    'fortalezas',
    'intereses',
    'comunicacion',
    'perfil-sensorial',
    'estrategias',
    'rutinas',
  ])('permite acceso directo a %s', async (slug) => {
    abrir(`/proyectos/${id}/${slug}`)
    await screen.findByRole('heading', { level: 2 })
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.queryByText(/Aportes de ejemplo/)).not.toBeInTheDocument()
  })

  it.each([`/proyectos/${id}`, `/proyectos/${id}/fortalezas`])(
    'protege %s sin una sesión',
    (ruta) => {
      abrir(ruta, { usuario: null, estado: 'anonimo' })
      expect(
        screen.getByRole('heading', { name: 'Hola de nuevo' }),
      ).toBeInTheDocument()
      expect(cliente.get).not.toHaveBeenCalled()
    },
  )

  it('rechaza una sección desconocida', () => {
    abrir(`/proyectos/${id}/inventada`)
    expect(
      screen.getByRole('heading', { name: 'Sección no encontrada' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Aportes de ejemplo/)).not.toBeInTheDocument()
  })
})

describe('Carga segura y errores del perfil', () => {
  it('oculta el proyecto anterior al cambiar de id e ignora su respuesta tardía', async () => {
    let resolverAnterior
    cliente.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverAnterior = resolve
        }),
    )
    const { result, rerender } = renderHook(
      ({ proyectoId }) => usePerfil(proyectoId),
      { initialProps: { proyectoId: id } },
    )
    const signalAnterior = cliente.get.mock.calls[0][1].signal
    const otroId = 'b4e6ebcd-a68d-490b-bd5c-12a4d623f7bb'
    cliente.get.mockResolvedValueOnce({
      data: { ...proyecto, id: otroId, nombre: 'Otro niño ficticio' },
    })
    rerender({ proyectoId: otroId })
    expect(result.current.proyecto).toBeNull()
    expect(result.current.cargando).toBe(true)
    expect(signalAnterior.aborted).toBe(true)
    await waitFor(() => expect(result.current.proyecto?.id).toBe(otroId))
    await act(async () => resolverAnterior({ data: proyecto }))
    expect(result.current.proyecto.nombre).toBe('Otro niño ficticio')
  })

  it.each([
    [403, 'No tenés permiso'],
    [404, 'No encontramos este proyecto'],
    [500, 'No pudimos cargar el perfil'],
    [undefined, 'Revisá tu conexión'],
  ])(
    'no muestra datos ni mocks cuando falla la API con %s',
    async (status, mensaje) => {
      cliente.get.mockRejectedValue({
        response: status ? { status } : undefined,
      })
      abrir()
      expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
      expect(screen.queryByText(/Aportes de ejemplo/)).not.toBeInTheDocument()
      expect(screen.queryByText('Creatividad')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: proyecto.nombre }),
      ).not.toBeInTheDocument()
    },
  )

  it('permite reintentar después de un error de conexión', async () => {
    cliente.get.mockRejectedValueOnce(new Error('Sin conexión'))
    abrir()
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('heading', { name: proyecto.nombre }),
    ).toBeInTheDocument()
  })

  it('no acepta datos de otro proyecto ni respuestas incompletas', async () => {
    cliente.get.mockResolvedValue({ data: { ...proyecto, id: 'otro' } })
    abrir()
    await screen.findByRole('alert')
    expect(screen.queryByText('Creatividad')).not.toBeInTheDocument()
  })

  it('no hace solicitudes relativas si falta la configuración de la API', async () => {
    cliente.defaults.baseURL = ''
    abrir()
    await screen.findByRole('alert')
    expect(cliente.get).not.toHaveBeenCalled()
  })

  it('cancela solicitudes al desmontar e ignora respuestas tardías', async () => {
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
    await act(async () => resolver({ data: proyecto }))
    expect(screen.queryByText(proyecto.nombre)).not.toBeInTheDocument()
  })
})

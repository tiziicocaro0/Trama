import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import { obtenerVistaImagen } from '../../api/archivos.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('../../api/archivos.js', () => ({
  descargarArchivo: vi.fn(),
  obtenerUrlDescargaArchivo: vi.fn(() => '/api/archivo'),
  obtenerVistaArchivo: vi.fn(),
  obtenerVistaImagen: vi.fn(),
}))

const proyectoId = '7b933b41-4a0d-4271-a764-7780ca5c86e4'
const fecha = '2026-10-20'
const proyecto = { id: proyectoId, nombre: 'Tomás', puedeCargar: true }
const actividades = [
  { id: 'tarde', proyectoId, titulo: 'Escuela', fecha, fechaOcurrencia: fecha, horaInicio: '13:00:00', recurrente: true, esCambio: false },
  { id: 'manana', proyectoId, titulo: 'Terapia ocupacional', fecha, fechaOcurrencia: fecha, horaInicio: '09:00:00', imagenId: 'imagen-1', recurrente: false, esCambio: false },
  { id: 'cambio', proyectoId, titulo: 'Cambio de actividad', fecha, fechaOcurrencia: fecha, horaInicio: '16:00:00', recurrente: false, esCambio: true },
]

function prepararApi({ respuesta = actividades, errorEventos } = {}) {
  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta === `/proyectos/${proyectoId}`) return { data: proyecto }
    if (ruta === `/proyectos/${proyectoId}/eventos`) {
      if (errorEventos) throw errorEventos
      return { data: respuesta }
    }
    if (ruta === `/proyectos/${proyectoId}/miembros`) return { data: [] }
    if (ruta === '/proyectos') return { data: [proyecto] }
    return { data: [] }
  })
}

function abrir(ruta = `/proyectos/${proyectoId}/hoy?fecha=${fecha}`) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario: { id: 'usuario-tutor' }, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9))
  prepararApi()
  obtenerVistaImagen.mockResolvedValue('blob:imagen-real')
})
afterEach(() => vi.useRealTimers())

describe('Vista del día', () => {
  it('se abre desde Calendario con la fecha seleccionada y conserva el proyecto', async () => {
    abrir(`/proyectos/${proyectoId}/calendario?fecha=${fecha}`)
    const enlace = await screen.findByRole('link', { name: 'Mostrarle el día' })
    expect(enlace).toHaveAttribute('href', `/proyectos/${proyectoId}/hoy?fecha=${fecha}`)

    await userEvent.click(enlace)
    expect(await screen.findByRole('heading', { name: 'Buenos días, Tomás' })).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: fecha, hasta: fecha } }))
  })

  it('muestra eventos del backend en orden horario, con imagen válida y marca los cambios', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: 'Buenos días, Tomás' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument()
    const lista = screen.getByRole('list', { name: 'Actividades del día' })
    const tarjetas = within(lista).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(3)
    expect(tarjetas[0]).toHaveTextContent('09:00')
    expect(tarjetas[0]).toHaveTextContent('Terapia ocupacional')
    await waitFor(() => expect(tarjetas[0].querySelector('img')).toHaveAttribute('src', 'blob:imagen-real'))
    expect(tarjetas[1]).toHaveTextContent('13:00')
    expect(tarjetas[2]).toHaveTextContent('Cambio')
    expect(obtenerVistaImagen).toHaveBeenCalledWith(proyectoId, 'imagen-1')
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: fecha, hasta: fecha } }))
  })

  it('consulta el día anterior y el siguiente sin recargar la aplicación', async () => {
    prepararApi({ respuesta: [] })
    abrir()
    await screen.findByText('Hoy no hay actividades programadas.')
    await userEvent.click(screen.getByRole('button', { name: 'Día anterior' }))
    await waitFor(() => expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: '2026-10-19', hasta: '2026-10-19' } })))
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2026-10-19')

    await userEvent.click(screen.getByRole('button', { name: 'Día siguiente' }))
    await waitFor(() => expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: fecha, hasta: fecha } })))
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', fecha)
  })

  it('vuelve con X al calendario del mismo proyecto y conserva la fecha', async () => {
    abrir()
    await screen.findByRole('heading', { name: 'Buenos días, Tomás' })
    await userEvent.click(screen.getByRole('button', { name: 'Volver al calendario' }))
    expect(await screen.findByRole('heading', { name: 'Calendario' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mostrarle el día' })).toHaveAttribute('href', `/proyectos/${proyectoId}/hoy?fecha=${fecha}`)
    await waitFor(() => expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.objectContaining({ params: { desde: '2026-10-19', hasta: '2026-10-25' } })))
  })

  it('muestra un estado vacío y conserva la navegación cuando no hay actividades', async () => {
    prepararApi({ respuesta: [] })
    abrir()
    expect(await screen.findByText('Hoy no hay actividades programadas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Día anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Día siguiente' })).toBeInTheDocument()
  })

  it('muestra estados de carga y error de acceso sin mostrar actividades', async () => {
    let resolverEventos
    cliente.get.mockImplementation((ruta) => {
      if (ruta === `/proyectos/${proyectoId}`) return Promise.resolve({ data: proyecto })
      if (ruta === `/proyectos/${proyectoId}/eventos`) return new Promise((resolve) => { resolverEventos = resolve })
      return Promise.resolve({ data: [] })
    })
    const { unmount } = abrir()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando las actividades')
    resolverEventos({ data: actividades })
    expect(await screen.findByRole('heading', { name: 'Buenos días, Tomás' })).toBeInTheDocument()

    unmount()
    prepararApi({ errorEventos: { response: { status: 403 } } })
    abrir()
    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso para ver este proyecto.')
    expect(screen.queryByText('Terapia ocupacional')).not.toBeInTheDocument()
  })
})

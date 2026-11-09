import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const id = '304d3b5e-8c8a-4a50-83d3-a84ade17b697'
const aporte = (idAporte, titulo, resultado, categoria, autorId = 'autor-1') => ({
  id: idAporte, proyectoId: id, tipo: 'ESTRATEGIA', titulo, contenido: 'Muestra una secuencia visual',
  datos: JSON.stringify({ categoria, situacion: 'Antes de salir', resultado, contextos: ['CASA'] }),
  visibilidad: 'TODOS', autorId, autorNombre: autorId === 'autor-1' ? 'Ana Ficticia' : 'Luis Ficticio',
  autorEspecialidades: [{ especialidad: 'PSICOLOGIA' }], creadoEn: '2026-10-30T14:20:00Z',
  puedeEditar: autorId === 'autor-1', archivos: [],
})
let lista

function abrir() {
  render(<MemoryRouter initialEntries={[`/proyectos/${id}/estrategias`]}><AuthContext.Provider value={{ usuario: { id: 'autor-1', nombre: 'Ana' }, estado: 'autenticado' }}><AppRoutes /></AuthContext.Provider></MemoryRouter>)
}

beforeEach(() => {
  lista = []
  cliente.get.mockReset().mockImplementation(async (ruta) => ({ data: ruta.endsWith('/aportes') ? lista : { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12', puedeCargar: true } }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => {
    if (ruta.endsWith('/archivos')) return { data: { id: 'archivo-1', nombreOriginal: 'pasos.png', tipoMime: 'image/png', tamanoBytes: 1024 } }
    if (ruta.endsWith('/archivar')) { lista = lista.filter((item) => !ruta.includes(item.id)); return { data: null } }
    const nuevo = { ...datos, id: 'estrategia-nueva', proyectoId: id, autorId: 'autor-1', autorNombre: 'Ana Ficticia', creadoEn: '2026-10-30T14:20:00Z', puedeEditar: true }
    lista = [nuevo, ...lista]
    return { data: nuevo }
  })
  cliente.put.mockReset().mockImplementation(async (_ruta, datos) => {
    const editado = { ...lista[0], ...datos }
    lista = [editado]
    return { data: editado }
  })
})

it.each([['FUNCIONO', 'Funcionó'], ['FUNCIONO_EN_PARTE', 'Funcionó en parte'], ['NO_FUNCIONO', 'No funcionó']])('crea y recupera una estrategia con resultado %s', async (resultado, etiqueta) => {
  abrir()
  await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
  await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
  expect(screen.getByText('Elegí una categoría.')).toBeInTheDocument()
  expect(screen.getByText('Contá qué se hizo.')).toBeInTheDocument()
  expect(screen.getByText('Describí en qué situación se aplicó.')).toBeInTheDocument()
  expect(screen.getByText('Elegí el resultado.')).toBeInTheDocument()
  expect(cliente.post).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('radio', { name: 'Anticipación y secuenciación' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Título del aporte' }), { target: { value: 'Anticipa los pasos' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Qué se hizo' }), { target: { value: 'Muestra una secuencia visual' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'En qué situación' }), { target: { value: 'Antes de salir' } })
  await userEvent.click(screen.getByRole('radio', { name: etiqueta, exact: true }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Casa' }))
  await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
  expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({
    tipo: 'ESTRATEGIA', titulo: 'Anticipa los pasos', contenido: 'Muestra una secuencia visual',
    datos: JSON.stringify({ categoria: 'ANTICIPACION_SECUENCIACION', situacion: 'Antes de salir', resultado, contextos: ['CASA'] }),
  }))
  expect(await screen.findByRole('heading', { name: 'Anticipa los pasos' })).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveTextContent(`Resultado: ${etiqueta}`)
})

it('combina resultado, categoría, búsqueda, especialidad, autor y visibilidad sobre la respuesta de la API', async () => {
  lista = [
    aporte('a', 'Secuencia de pasos', 'FUNCIONO', 'ANTICIPACION_SECUENCIACION'),
    aporte('b', 'Pausa breve', 'FUNCIONO_EN_PARTE', 'REGULACION_PAUSAS', 'autor-2'),
    aporte('c', 'Otra secuencia', 'NO_FUNCIONO', 'ANTICIPACION_SECUENCIACION'),
  ]
  abrir()
  await screen.findByRole('heading', { name: 'Secuencia de pasos' })
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Resultado' }), 'FUNCIONO')
  await userEvent.click(screen.getByRole('button', { name: 'Anticipación y secuenciación' }))
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Especialidad' }), 'PSICOLOGIA')
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en estrategias' }), 'Secuencia')
  await userEvent.click(screen.getByRole('switch', { name: 'Solo mis aportes' }))
  expect(screen.getAllByRole('article')).toHaveLength(1)
  expect(screen.getByRole('heading', { name: 'Secuencia de pasos' })).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Visibilidad' }), 'SOLO_TUTORES')
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

it('precarga, edita, muestra historial y archiva solo aportes propios', async () => {
  lista = [aporte('propio', 'Secuencia de pasos', 'FUNCIONO', 'ANTICIPACION_SECUENCIACION'), aporte('ajeno', 'Pausa breve', 'FUNCIONO', 'REGULACION_PAUSAS', 'autor-2')]
  cliente.get.mockImplementation(async (ruta) => ({ data: ruta.endsWith('/versiones') ? [
    { numero: 2, actual: true, titulo: 'Secuencia de pasos', contenido: 'Nueva acción', datos: lista[0].datos, autorNombre: 'Ana Ficticia', fechaCreacion: '2026-10-30T14:20:00Z' },
    { numero: 1, actual: false, titulo: 'Secuencia de pasos', contenido: 'Muestra una secuencia visual', datos: lista[0].datos, autorNombre: 'Ana Ficticia', fechaCreacion: '2026-10-29T14:20:00Z' },
  ] : ruta.endsWith('/aportes') ? lista : { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12', puedeCargar: true } }))
  abrir()
  await screen.findByRole('heading', { name: 'Secuencia de pasos' })
  expect(screen.queryByRole('button', { name: 'Editar aporte: Pausa breve' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Editar aporte: Secuencia de pasos' }))
  expect(screen.getByRole('textbox', { name: 'En qué situación' })).toHaveValue('Antes de salir')
  await userEvent.click(screen.getByRole('radio', { name: 'Funcionó en parte' }))
  await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
  expect(cliente.put).toHaveBeenCalledWith(`/proyectos/${id}/aportes/propio`, expect.objectContaining({ tipo: 'ESTRATEGIA', datos: expect.stringContaining('FUNCIONO_EN_PARTE') }))
  await userEvent.click(await screen.findByRole('button', { name: 'Ver historial del aporte: Secuencia de pasos' }))
  expect(await screen.findByRole('list', { name: 'Versiones del aporte' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
  await userEvent.click(screen.getByRole('button', { name: 'Archivar aporte: Secuencia de pasos' }))
  await waitFor(() => expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes/propio/archivar`))
  expect(await screen.findByText('Aporte archivado.')).toBeInTheDocument()
})

it('adjunta un archivo real al guardar la estrategia', async () => {
  abrir()
  await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
  await userEvent.click(screen.getByRole('radio', { name: 'Regulación y pausas' }))
  await userEvent.type(screen.getByRole('textbox', { name: 'Título del aporte' }), 'Pausa breve')
  await userEvent.type(screen.getByRole('textbox', { name: 'Qué se hizo' }), 'Ofreció una pausa')
  await userEvent.type(screen.getByRole('textbox', { name: 'En qué situación' }), 'Después de jugar')
  await userEvent.click(screen.getByRole('radio', { name: 'Funcionó' }))
  fireEvent.drop(screen.getByTestId('zona-soltar-archivo'), { dataTransfer: { files: [new File(['imagen'], 'pasos.png', { type: 'image/png' })] } })
  expect(await screen.findByText('pasos.png')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
  expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({ archivoIds: ['archivo-1'] }))
})

it('muestra el estado vacío con datos reales de la API', async () => {
  abrir()
  expect(await screen.findByText(/Todavía no hay aportes/)).toBeInTheDocument()
})

it('muestra una estrategia anterior sin campos específicos', async () => {
  lista = [{ ...aporte('anterior', 'Apoyo anterior', 'FUNCIONO', 'REGULACION_PAUSAS'), datos: null }]
  abrir()
  expect(await screen.findByRole('heading', { name: 'Apoyo anterior' })).toBeInTheDocument()
  expect(screen.getByText('Muestra una secuencia visual')).toBeInTheDocument()
})

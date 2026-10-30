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

const id = '9d0f3a51-62f4-4c0e-9a3e-5b7c1f2e8a10'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }
const LEYENDA =
  'Las notas no reemplazan la historia clínica ni los informes de cada profesional.'
const nota = {
  id: 'nota-ficticia',
  tipo: 'NOTA_PROFESIONAL',
  titulo: 'Anticipar los cambios',
  contenido: 'Usar el cronograma visual antes de cada recreo',
  datos: '{"tipoNota":"ORIENTACION","fecha":"2026-10-20"}',
  visibilidad: 'TODOS',
  autorNombre: 'Laura Gómez',
  autorEspecialidades: [{ especialidad: 'PSICOPEDAGOGIA', aclaracion: null }],
  creadoEn: '2026-10-20T15:00:00Z',
  actualizadoEn: '2026-10-20T15:00:00Z',
  puedeEditar: false,
}
let permisos

function abrirNotas() {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/notas`]}>
      <AuthContext.Provider
        value={{ usuario: { nombre: 'Usuario ficticio' }, estado: 'autenticado' }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  permisos = { puedeCargar: true, puedeCargarNotas: true }
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/aportes') ? [nota] : { ...proyecto, ...permisos },
  }))
})

describe('Notas profesionales (4.2)', () => {
  it('muestra la leyenda fija sobre la historia clínica', async () => {
    abrirNotas()
    expect(await screen.findByText(LEYENDA)).toBeInTheDocument()
  })

  it('cada nota muestra autor, especialidad, tipo y fecha', async () => {
    abrirNotas()
    const articulo = (
      await screen.findByRole('heading', { name: nota.titulo })
    ).closest('article')
    expect(
      within(articulo).getByText('Cargado por: Laura Gómez · Psicopedagogía'),
    ).toBeInTheDocument()
    expect(
      within(articulo).getByText('Orientación · Fecha: 20/10/2026'),
    ).toBeInTheDocument()
  })

  it('un profesional ve "Agregar nota" con tipo, fecha, título, texto y visibilidad', async () => {
    abrirNotas()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar nota' }),
    )
    expect(
      screen.getByRole('combobox', { name: 'Tipo de nota' }),
    ).toHaveValue('ORIENTACION')
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Título' })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Texto de la nota (opcional)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: '¿Quién puede verlo?' }),
    ).toBeInTheDocument()
  })

  it('un tutor o familiar ve las notas pero no puede agregar una', async () => {
    permisos = { puedeCargar: true, puedeCargarNotas: false }
    abrirNotas()
    expect(
      await screen.findByRole('heading', { name: nota.titulo }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar nota' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Las notas las cargan los profesionales de educación y salud.',
      ),
    ).toBeInTheDocument()
  })
})

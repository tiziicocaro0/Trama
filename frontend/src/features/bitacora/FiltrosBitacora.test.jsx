import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const proyectoId = '11111111-1111-1111-1111-111111111111'
const autorUnoId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
const autorDosId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'

const proyectoMock = {
  id: proyectoId,
  nombre: 'Tomás',
  apellido: 'Ejemplo',
  apodo: 'Tomi',
  fechaNacimiento: '2018-05-12',
  puedeCargar: true,
}

const miembrosMock = [
  {
    id: 'membresia-1',
    usuarioId: autorUnoId,
    nombre: 'Marta',
    apellido: 'Fernández',
    rol: 'TUTOR',
    esAdmin: true,
  },
  {
    id: 'membresia-2',
    usuarioId: autorDosId,
    nombre: 'María',
    apellido: 'Díaz',
    rol: 'EDUCACION',
    esAdmin: false,
  },
]

function crearObs(id, autorId, contenido, fecha, contexto, etiquetas) {
  return {
    id,
    proyectoId,
    autorId,
    tipo: 'OBSERVACION',
    titulo: contenido,
    contenido,
    datos: JSON.stringify({ fecha, contexto, etiquetas }),
    visibilidad: 'TODOS',
    archivado: false,
    creadoEn: fecha,
    actualizadoEn: fecha,
    puedeEditar: autorId === autorUnoId,
  }
}

const obsEscuelaLogro = crearObs(
  'obs-1',
  autorUnoId,
  'Leyó un cuento corto en el aula.',
  '2026-10-20T10:00:00-03:00',
  'ESCUELA',
  ['LOGRO', 'COMUNICACION'],
)

const obsEscuelaDificultad = crearObs(
  'obs-2',
  autorDosId,
  'Se molestó por el timbre fuerte.',
  '2026-10-21T11:00:00-03:00',
  'ESCUELA',
  ['DIFICULTAD'],
)

const obsCasaLogro = crearObs(
  'obs-3',
  autorUnoId,
  'Cenó tranquilo con toda la familia.',
  '2026-10-22T20:00:00-03:00',
  'CASA',
  ['LOGRO', 'SOCIAL'],
)

function abrirBitacora() {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/bitacora`]}>
      <AuthContext.Provider
        value={{
          usuario: { id: autorUnoId, nombre: 'Marta', apellido: 'Fernández' },
          estado: 'autenticado',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Filtros y paginación de la bitácora (Tarea 4.1)', () => {
  beforeEach(() => {
    cliente.get.mockReset().mockImplementation(async (ruta) => {
      if (ruta.endsWith('/bitacora')) {
        return { data: [obsCasaLogro, obsEscuelaDificultad, obsEscuelaLogro] }
      }
      if (ruta.endsWith('/miembros')) {
        return { data: miembrosMock }
      }
      return { data: proyectoMock }
    })
  })

  it('permite combinar filtros por contexto, etiqueta, autor y fechas, y limpiarlos con "Limpiar filtros"', async () => {
    abrirBitacora()

    expect(await screen.findAllByRole('article')).toHaveLength(3)

    // Filtra por contexto ESCUELA y etiqueta LOGRO a la vez
    await userEvent.selectOptions(screen.getByLabelText('Contexto'), 'ESCUELA')
    await userEvent.selectOptions(screen.getByLabelText('Etiqueta'), 'LOGRO')

    const articulosFiltrados = await screen.findAllByRole('article')
    expect(articulosFiltrados).toHaveLength(1)
    expect(
      screen.getByText('Leyó un cuento corto en el aula.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Se molestó por el timbre fuerte.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Cenó tranquilo con toda la familia.'),
    ).not.toBeInTheDocument()

    // Verifica que también envió los query params al backend
    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/bitacora`,
      expect.objectContaining({
        params: { contexto: 'ESCUELA', etiqueta: 'LOGRO' },
      }),
    )

    // Limpia los filtros con el botón "Limpiar filtros"
    const botonLimpiar = screen.getByRole('button', { name: 'Limpiar filtros' })
    expect(botonLimpiar).not.toBeDisabled()
    await userEvent.click(botonLimpiar)

    expect(await screen.findAllByRole('article')).toHaveLength(3)
    expect(screen.getByLabelText('Contexto')).toHaveValue('')
    expect(screen.getByLabelText('Etiqueta')).toHaveValue('')

    // Filtra por autor (María Díaz) y rango de fechas
    await userEvent.selectOptions(screen.getByLabelText('Autor'), autorDosId)
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-10-21' },
    })
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2026-10-21' },
    })

    expect(await screen.findAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByText('Se molestó por el timbre fuerte.'),
    ).toBeInTheDocument()
  })

  it('muestra el botón "Ver más" cuando hay 20 observaciones y carga las siguientes al pulsarlo', async () => {
    const primeraPagina = Array.from({ length: 20 }, (_, i) =>
      crearObs(
        `obs-p0-${i + 1}`,
        autorUnoId,
        `Observación página 1 número ${i + 1}`,
        `2026-10-${String(25 - (i % 20)).padStart(2, '0')}T10:00:00-03:00`,
        'ESCUELA',
        ['LOGRO'],
      ),
    )
    const segundaPagina = [
      crearObs(
        'obs-p1-1',
        autorDosId,
        'Observación adicional de la página siguiente',
        '2026-10-01T09:00:00-03:00',
        'CASA',
        ['SOCIAL'],
      ),
    ]

    cliente.get.mockImplementation(async (ruta, config) => {
      if (ruta.endsWith('/bitacora')) {
        return {
          data: config?.params?.pagina === 1 ? segundaPagina : primeraPagina,
        }
      }
      if (ruta.endsWith('/miembros')) return { data: miembrosMock }
      return { data: proyectoMock }
    })

    abrirBitacora()

    expect(await screen.findAllByRole('article')).toHaveLength(20)
    const botonVerMas = screen.getByRole('button', { name: 'Ver más' })
    expect(botonVerMas).toBeInTheDocument()

    await userEvent.click(botonVerMas)

    expect(await screen.findAllByRole('article')).toHaveLength(21)
    expect(
      screen.getByText('Observación adicional de la página siguiente'),
    ).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledWith(
      `/proyectos/${proyectoId}/bitacora`,
      expect.objectContaining({ params: { pagina: 1 } }),
    )
    // Como la segunda página trajo menos de 20, ya no hay más páginas por cargar
    expect(
      screen.queryByRole('button', { name: 'Ver más' }),
    ).not.toBeInTheDocument()
  })
})


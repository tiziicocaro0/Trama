import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

vi.mock('../../api/cliente.js', () => {
  const mockCliente = {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return { default: mockCliente, clienteApi: mockCliente }
})

const proyectoId = '7b933b41-4a0d-4271-a764-7780ca5c86e4'
const docenteId = '22222222-2222-2222-2222-222222222222'

const proyectoMock = {
  id: proyectoId,
  nombre: 'Tomás',
  apellido: 'Fernández',
  apodo: 'Tomi',
  fechaNacimiento: '2017-05-12',
  escuela: 'Escuela N.º 12',
  grado: '3.º grado',
  puedeCargar: true,
}

const miembrosMock = [
  {
    id: 'm-2',
    usuarioId: docenteId,
    nombre: 'Lucía',
    apellido: 'Pérez',
    rol: 'EDUCACION',
    esAdmin: false,
  },
]

let eventosActuales = []

function renderCalendario() {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/calendario`]}>
      <AuthContext.Provider
        value={{
          usuario: { id: docenteId, nombre: 'Lucía' },
          estado: 'autenticado',
          cerrarSesion: vi.fn(),
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Eventos recurrentes semanales en el calendario (Tarea 5.1)', () => {
  beforeEach(() => {
    eventosActuales = [
      {
        id: 'ev-recurrente-1',
        proyectoId,
        autorId: docenteId,
        titulo: 'Taller de música',
        descripcion: 'Sesión grupal de los martes.',
        fecha: '2026-11-03',
        horaInicio: '10:00:00',
        horaFin: '11:00:00',
        imagenId: null,
        creadoEn: '2026-10-30T10:00:00Z',
        recurrente: true,
        diaSemana: 2,
        fechaFinRecurrencia: '2026-12-15',
        esCambio: false,
        fechaOcurrencia: '2026-11-10',
        puedeEditar: true,
      },
    ]

    cliente.get.mockReset().mockImplementation(async (url) => {
      if (url === `/proyectos/${proyectoId}`) return { data: proyectoMock }
      if (url === `/proyectos/${proyectoId}/eventos`) return { data: eventosActuales }
      if (url === `/proyectos/${proyectoId}/miembros`) return { data: miembrosMock }
      if (url === '/proyectos') return { data: [proyectoMock] }
      return { data: [] }
    })

    cliente.post.mockReset().mockImplementation(async (url, body) => {
      if (url === `/proyectos/${proyectoId}/eventos`) {
        const nuevo = {
          id: 'ev-rec-nuevo',
          proyectoId,
          autorId: docenteId,
          ...body,
          fechaOcurrencia: body.fecha,
          puedeEditar: true,
        }
        eventosActuales = [...eventosActuales, nuevo]
        return { data: nuevo }
      }
      return { data: {} }
    })

    cliente.put.mockReset().mockImplementation(async () => ({ data: {} }))
    cliente.delete.mockReset().mockImplementation(async () => ({ data: null }))
  })

  it('permite marcar "Se repite todas las semanas", elegir el día de la semana y una fecha de fin opcional', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await screen.findByRole('heading', { name: 'Taller de música' })
    expect(screen.getByText('Cada martes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Nuevo evento/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })

    await user.type(within(dialog).getByLabelText(/Título/i), 'Fonoaudiología semanal')

    const inputFecha = within(dialog).getByLabelText('Fecha')
    await user.clear(inputFecha)
    await user.type(inputFecha, '02112026') // Lunes 2026-11-02

    const checkboxRecurrente = within(dialog).getByLabelText(
      /Se repite todas las semanas/i,
    )
    await user.click(checkboxRecurrente)
    expect(checkboxRecurrente).toBeChecked()

    // Al elegir "Jueves" (4), la fecha se sincroniza al jueves 2026-11-05
    const selectorDia = within(dialog).getByLabelText(/Día de la semana/i)
    await user.selectOptions(selectorDia, '4')

    const inputFechaFin = within(dialog).getByLabelText(
      /Fecha de fin \(opcional\)/i,
    )
    await user.clear(inputFechaFin)
    await user.type(inputFechaFin, '17122026')

    fireEvent.change(within(dialog).getByLabelText(/Hora de inicio/i), {
      target: { value: '15:00' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Hora de fin/i), {
      target: { value: '16:00' },
    })

    await user.click(within(dialog).getByRole('button', { name: 'Crear evento' }))

    await waitFor(() => {
      expect(cliente.post).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos`,
        expect.objectContaining({
          titulo: 'Fonoaudiología semanal',
          fecha: '2026-11-05',
          horaInicio: '15:00',
          horaFin: '16:00',
          recurrente: true,
          diaSemana: 4,
          fechaFinRecurrencia: '2026-12-17',
        }),
      )
    })
  })

  it('al editar un evento recurrente pregunta "¿Solo este o toda la serie?" y permite editar solo esa ocurrencia o toda la serie', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await screen.findByRole('heading', { name: 'Taller de música' })

    // 1) Editar -> "Solo este"
    await user.click(
      screen.getByRole('button', { name: 'Editar Taller de música' }),
    )

    const dialogoAlcance = await screen.findByRole('dialog', {
      name: '¿Solo este o toda la serie?',
    })
    await user.click(
      within(dialogoAlcance).getByRole('button', { name: 'Solo este' }),
    )

    const modalEdicion = await screen.findByRole('dialog', {
      name: 'Editar evento',
    })
    const inputTitulo = within(modalEdicion).getByLabelText(/Título/i)
    await user.clear(inputTitulo)
    await user.type(inputTitulo, 'Taller de música (invitado especial)')

    await user.click(
      within(modalEdicion).getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() => {
      expect(cliente.put).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-recurrente-1/ocurrencias/2026-11-10`,
        {
          titulo: 'Taller de música (invitado especial)',
          horaInicio: '10:00',
          horaFin: '11:00',
        },
      )
    })

    // 2) Editar -> "Toda la serie"
    await user.click(
      screen.getByRole('button', { name: 'Editar Taller de música' }),
    )
    const dialogoAlcanceSerie = await screen.findByRole('dialog', {
      name: '¿Solo este o toda la serie?',
    })
    await user.click(
      within(dialogoAlcanceSerie).getByRole('button', {
        name: 'Toda la serie',
      }),
    )

    const modalSerie = await screen.findByRole('dialog', {
      name: 'Editar evento',
    })
    await user.click(
      within(modalSerie).getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() => {
      expect(cliente.put).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-recurrente-1`,
        expect.objectContaining({
          titulo: 'Taller de música',
          recurrente: true,
          diaSemana: 2,
          fechaFinRecurrencia: '2026-12-15',
        }),
      )
    })
  })

  it('al eliminar un evento recurrente pregunta "¿Solo este o toda la serie?" y ejecuta la cancelación o el borrado de la serie', async () => {
    const user = userEvent.setup()
    renderCalendario()

    await screen.findByRole('heading', { name: 'Taller de música' })

    // 1) Eliminar -> "Solo este"
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Taller de música' }),
    )
    const dialogoAlcance = await screen.findByRole('dialog', {
      name: '¿Solo este o toda la serie?',
    })
    await user.click(
      within(dialogoAlcance).getByRole('button', { name: 'Solo este' }),
    )

    await waitFor(() => {
      expect(cliente.delete).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-recurrente-1/ocurrencias/2026-11-10`,
      )
    })

    // 2) Eliminar -> "Toda la serie"
    await user.click(
      screen.getByRole('button', { name: 'Eliminar Taller de música' }),
    )
    const dialogoAlcanceSerie = await screen.findByRole('dialog', {
      name: '¿Solo este o toda la serie?',
    })
    await user.click(
      within(dialogoAlcanceSerie).getByRole('button', {
        name: 'Toda la serie',
      }),
    )

    await waitFor(() => {
      expect(cliente.delete).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-recurrente-1`,
      )
    })
  })
})


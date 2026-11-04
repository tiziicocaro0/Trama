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
const tutorId = '11111111-1111-1111-1111-111111111111'
const docenteId = '22222222-2222-2222-2222-222222222222'
const familiarId = '33333333-3333-3333-3333-333333333333'

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
    id: 'm-1',
    usuarioId: tutorId,
    nombre: 'Valeria',
    apellido: 'Gómez',
    rol: 'TUTOR',
    esAdmin: true,
  },
  {
    id: 'm-2',
    usuarioId: docenteId,
    nombre: 'Lucía',
    apellido: 'Pérez',
    rol: 'EDUCACION',
    esAdmin: false,
  },
  {
    id: 'm-3',
    usuarioId: familiarId,
    nombre: 'Carlos',
    apellido: 'Fernández',
    rol: 'FAMILIAR',
    esAdmin: false,
  },
]

let eventosActuales = []

// Abre en la semana de la reunión de prueba (el calendario arranca en la semana actual)
function renderCalendario(usuario = { id: docenteId, nombre: 'Lucía' }) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/calendario?fecha=2026-10-15`]}>
      <AuthContext.Provider
        value={{
          usuario,
          estado: 'autenticado',
          cerrarSesion: vi.fn(),
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

// El detalle de un evento se abre desde la grilla del calendario (5.2)
async function abrirDetalle(user) {
  await user.click(
    await screen.findByRole('button', { name: 'Ver evento: Reunión con equipo de orientación' }),
  )
  return screen.findByRole('dialog', { name: 'Detalle de Reunión con equipo de orientación' })
}

describe('Reuniones con participantes y acta (Tarea 5.5)', () => {
  beforeEach(() => {
    eventosActuales = [
      {
        id: 'reunion-pasada-1',
        proyectoId,
        autorId: tutorId,
        titulo: 'Reunión con equipo de orientación',
        descripcion: 'Coordinar apoyos en el aula',
        fecha: '2026-10-15',
        horaInicio: '09:00:00',
        horaFin: '10:00:00',
        tipo: 'REUNION',
        participanteIds: [docenteId],
        acta: null,
        fechaOcurrencia: '2026-10-15',
        recurrente: false,
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
          id: 'reunion-nueva-1',
          proyectoId,
          autorId: docenteId,
          ...body,
          fechaOcurrencia: body.fecha,
        }
        eventosActuales = [...eventosActuales, nuevo]
        return { data: nuevo }
      }
      return { data: {} }
    })

    cliente.put.mockReset().mockImplementation(async (url, body) => {
      if (url.endsWith('/acta')) {
        const eventoId = url.split('/')[4]
        eventosActuales = eventosActuales.map((e) =>
          e.id === eventoId ? { ...e, acta: body.acta } : e,
        )
        return { data: null }
      }
      return { data: {} }
    })
  })

  it('permite crear un evento de tipo reunión seleccionando participantes', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })

    await screen.findByRole('button', { name: 'Ver evento: Reunión con equipo de orientación' })

    // Abrir modal de nuevo evento
    // En la grilla semanal se crea un evento desde un horario libre (5.2)
    await user.click(screen.getAllByRole('button', { name: /Agregar evento el .* a las 14:00/ })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })

    await user.type(within(dialog).getByLabelText(/Título/i), 'Reunión de seguimiento mensual')

    const inputFecha = within(dialog).getByLabelText('Fecha')
    await user.clear(inputFecha)
    await user.type(inputFecha, '15112026')

    fireEvent.change(within(dialog).getByLabelText(/Hora de inicio/i), {
      target: { value: '14:00' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Hora de fin/i), {
      target: { value: '15:00' },
    })

    // Marcar "Es una reunión"
    const checkboxReunion = within(dialog).getByLabelText(/Es una reunión/i)
    await user.click(checkboxReunion)
    expect(checkboxReunion).toBeChecked()

    // Elegir participante "Valeria Gómez" (tutora)
    const checkValeria = within(dialog).getByLabelText(/Valeria Gómez/i)
    await user.click(checkValeria)
    expect(checkValeria).toBeChecked()

    await user.click(within(dialog).getByRole('button', { name: 'Crear evento' }))

    await waitFor(() => {
      expect(cliente.post).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos`,
        expect.objectContaining({
          titulo: 'Reunión de seguimiento mensual',
          tipo: 'REUNION',
          participanteIds: [tutorId],
        }),
      )
    })
  })

  it('un participante puede registrar el acta en una reunión pasada y se visualiza para la red', async () => {
    const user = userEvent.setup()
    // La docente está como participante en la reunión pasada
    renderCalendario({ id: docenteId, nombre: 'Lucía' })

    const detalle = await abrirDetalle(user)
    expect(within(detalle).getByText('Reunión')).toBeInTheDocument()

    // Se ve el botón para registrar acta
    const botonRegistrar = within(detalle).getByRole('button', { name: /Registrar acta/i })
    expect(botonRegistrar).toBeInTheDocument()

    await user.click(botonRegistrar)

    const textarea = screen.getByLabelText(/Contenido del acta/i)
    await user.type(
      textarea,
      'Se acordó armar un cuaderno de comunicación diario y pausas activas.',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar acta' }))

    await waitFor(() => {
      expect(cliente.put).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/reunion-pasada-1/acta`,
        {
          acta: 'Se acordó armar un cuaderno de comunicación diario y pausas activas.',
        },
      )
    })

    expect(
      await screen.findByText(
        'Se acordó armar un cuaderno de comunicación diario y pausas activas.',
      ),
    ).toBeInTheDocument()
  })

  it('un miembro no participante no ve el botón para registrar o editar el acta', async () => {
    // El familiar NO es participante en 'reunion-pasada-1'
    const user = userEvent.setup()
    renderCalendario({ id: familiarId, nombre: 'Carlos' })

    await abrirDetalle(user)
    expect(screen.queryByRole('button', { name: /Registrar acta/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar acta/i })).not.toBeInTheDocument()
  })
})


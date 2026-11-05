import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 10, 10, 12)) })
afterEach(() => vi.useRealTimers())

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

function renderCalendario(usuario = { id: docenteId, nombre: 'Lucía' }) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/calendario`]}>
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

describe('Calendario y eventos del niño (Tarea 5.0)', () => {
  beforeEach(() => {
    eventosActuales = [
      {
        id: 'ev-propio',
        proyectoId,
        autorId: docenteId,
        titulo: 'Acto del Día de la Tradición',
        descripcion: 'Traer ropa cómoda y auriculares por si hay música fuerte.',
        fecha: '2026-11-10',
        horaInicio: '09:30:00',
        horaFin: '11:00:00',
        imagenId: null,
        creadoEn: '2026-10-30T10:00:00Z',
        recurrente: false,
        fechaOcurrencia: '2026-11-10',
      },
      {
        id: 'ev-ajeno',
        proyectoId,
        autorId: familiarId,
        titulo: 'Control odontológico',
        descripcion: 'Turno con la Dra. Martínez.',
        fecha: '2026-11-15',
        horaInicio: '16:00:00',
        horaFin: '17:00:00',
        imagenId: 'img-odontologo-1',
        creadoEn: '2026-10-30T12:00:00Z',
        recurrente: false,
        fechaOcurrencia: '2026-11-15',
      },
    ]

    cliente.get.mockReset().mockImplementation(async (url) => {
      if (url === `/proyectos/${proyectoId}`) {
        return { data: proyectoMock }
      }
      if (url === `/proyectos/${proyectoId}/eventos`) {
        return { data: eventosActuales }
      }
      if (url === `/proyectos/${proyectoId}/miembros`) {
        return { data: miembrosMock }
      }
      if (url === '/proyectos') {
        return { data: [proyectoMock] }
      }
      if (url === '/notificaciones') {
        return { data: [] }
      }
      return { data: [] }
    })

    cliente.post.mockReset().mockImplementation(async (url, body) => {
      if (url === `/proyectos/${proyectoId}/archivos`) {
        return {
          data: {
            id: 'archivo-imagen-123',
            nombreOriginal: 'pictograma-museo.png',
            tipoMime: 'image/png',
            tamanoBytes: 1024,
          },
        }
      }
      if (url === `/proyectos/${proyectoId}/eventos`) {
        const nuevo = {
          id: 'ev-nuevo',
          proyectoId,
          autorId: docenteId,
          ...body,
          creadoEn: '2026-10-31T14:00:00Z',
          recurrente: false,
          fechaOcurrencia: body.fecha,
        }
        eventosActuales = [...eventosActuales, nuevo]
        return { data: nuevo }
      }
      return { data: {} }
    })

    cliente.put.mockReset().mockImplementation(async (url, body) => {
      const idEvento = url.split('/').pop()
      let actualizado = null
      eventosActuales = eventosActuales.map((ev) => {
        if (ev.id !== idEvento) return ev
        actualizado = { ...ev, ...body, fechaOcurrencia: body.fecha }
        return actualizado
      })
      return { data: actualizado }
    })

    cliente.delete.mockReset().mockImplementation(async (url) => {
      const idEvento = url.split('/').pop()
      eventosActuales = eventosActuales.filter((ev) => ev.id !== idEvento)
      return { data: null }
    })
  })

  it('muestra los eventos del calendario y permite crear un evento con título, fecha, horario, descripción e imagen opcional (SubirArchivo)', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })

    expect(await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver evento: Control odontológico' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' }))
    expect(screen.getByText('09:30 a 11:00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))

    // Abrir el modal desde el + de un horario vacío del calendario.
    await user.click(screen.getAllByRole('button', { name: /Agregar evento el .* a las 08:00/ })[0])

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })

    const inputTitulo = within(dialog).getByLabelText(/Título/i)
    expect(inputTitulo).toHaveAttribute('maxLength', '150')
    fireEvent.change(inputTitulo, { target: { value: 'Visita al museo de ciencias' } })

    const inputFecha = within(dialog).getByLabelText('Fecha')
    fireEvent.change(inputFecha, { target: { value: '20/11/2026' } })

    const inputHoraInicio = within(dialog).getByLabelText(/Hora de inicio/i)
    const inputHoraFin = within(dialog).getByLabelText(/Hora de fin/i)

    // Validar que rechaza horaFin <= horaInicio
    fireEvent.change(inputHoraInicio, { target: { value: '14:00' } })
    fireEvent.change(inputHoraFin, { target: { value: '13:00' } })
    await user.click(within(dialog).getByRole('button', { name: 'Crear evento' }))

    expect(
      await within(dialog).findByText(
        'La hora de fin debe ser posterior a la hora de inicio.',
      ),
    ).toBeInTheDocument()

    // Corregir horario y completar descripción e imagen opcional con SubirArchivo
    fireEvent.change(inputHoraInicio, { target: { value: '10:00' } })
    fireEvent.change(inputHoraFin, { target: { value: '12:30' } })

    const inputDescripcion = within(dialog).getByLabelText(/Descripción/i)
    fireEvent.change(inputDescripcion, { target: { value: 'Recorrido guiado con anticipación visual.' } })

    const inputArchivo = within(dialog).getByLabelText(
      /Archivos adjuntos \(opcional\)/i,
    )
    const archivoImagen = new File(['contenido'], 'pictograma-museo.png', {
      type: 'image/png',
    })
    await user.upload(inputArchivo, archivoImagen)

    expect(
      await within(dialog).findByText('pictograma-museo.png'),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Crear evento' }))

    await waitFor(() => {
      expect(cliente.post).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos`,
        {
          titulo: 'Visita al museo de ciencias',
          descripcion: 'Recorrido guiado con anticipación visual.',
          fecha: '2026-11-20',
          horaInicio: '10:00',
          horaFin: '12:30',
          imagenId: 'archivo-imagen-123',
          recurrente: false,
          diaSemana: null,
          fechaFinRecurrencia: null,
          tipo: 'COMUN',
          participanteIds: [],
        },
      )
    })

    await user.click(screen.getByRole('button', { name: 'Período siguiente' }))
    expect(
      await screen.findByRole('button', { name: 'Ver evento: Visita al museo de ciencias' }),
    ).toBeInTheDocument()
  }, 10000)

  it('permite editar un evento propio con el mismo formulario y oculta editar/eliminar en eventos ajenos si no es tutor', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })

    await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' })
    await user.click(screen.getByRole('button', { name: 'Ver evento: Control odontológico' }))
    expect(screen.queryByRole('button', { name: 'Editar Control odontológico' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar Control odontológico' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    await user.click(screen.getByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' }))

    // La docente ve Editar y Eliminar en su propio evento, pero NO en el del familiar
    expect(
      screen.getByRole('button', {
        name: 'Editar Acto del Día de la Tradición',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Eliminar Acto del Día de la Tradición',
      }),
    ).toBeInTheDocument()

    // Abrir modal de edición
    await user.click(
      screen.getByRole('button', {
        name: 'Editar Acto del Día de la Tradición',
      }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Editar evento' })
    const inputTitulo = within(dialog).getByLabelText(/Título/i)
    expect(inputTitulo).toHaveValue('Acto del Día de la Tradición')

    fireEvent.change(inputTitulo, { target: { value: 'Acto del Día de la Tradición (reprogramado)' } })

    await user.click(
      within(dialog).getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() => {
      expect(cliente.put).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-propio`,
        expect.objectContaining({
          titulo: 'Acto del Día de la Tradición (reprogramado)',
          fecha: '2026-11-10',
          horaInicio: '09:30',
          horaFin: '11:00',
        }),
      )
    })

    expect(
      await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición (reprogramado)' }),
    ).toBeInTheDocument()
  })

  it('permite que un tutor edite o elimine cualquier evento del niño', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: tutorId, nombre: 'Valeria' })

    await screen.findByRole('button', { name: 'Ver evento: Control odontológico' })
    await user.click(screen.getByRole('button', { name: 'Ver evento: Control odontológico' }))

    // La tutora ve Editar y Eliminar tanto en el evento de la docente como en el del familiar
    const botonEliminarAjeno = screen.getByRole('button', {
      name: 'Eliminar Control odontológico',
    })
    expect(botonEliminarAjeno).toBeInTheDocument()

    await user.click(botonEliminarAjeno)

    await waitFor(() => {
      expect(cliente.delete).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/eventos/ev-ajeno`,
      )
    })

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Ver evento: Control odontológico' }),
      ).not.toBeInTheDocument()
    })
  })

  it('al tocar afuera se cierra el alta y guarda un borrador para ese día, que se puede descartar', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })
    await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' })
    const abrirAlta = () =>
      user.click(screen.getAllByRole('button', { name: /Agregar evento el .* a las 08:00/ })[0])

    await abrirAlta()
    let dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })
    fireEvent.change(within(dialog).getByLabelText(/Título/i), { target: { value: 'Turno con la fono' } })
    fireEvent.mouseDown(dialog)
    expect(screen.queryByRole('dialog', { name: 'Nuevo evento' })).not.toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos`, expect.anything())

    await abrirAlta()
    dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })
    expect(within(dialog).getByLabelText(/Título/i)).toHaveValue('Turno con la fono')
    expect(within(dialog).getByText('Recuperamos el borrador que dejaste para este día.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Descartar borrador' }))
    expect(screen.queryByRole('dialog', { name: 'Nuevo evento' })).not.toBeInTheDocument()

    await abrirAlta()
    dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })
    expect(within(dialog).getByLabelText(/Título/i)).toHaveValue('')
    expect(within(dialog).queryByRole('button', { name: 'Descartar borrador' })).not.toBeInTheDocument()
  })

  it('el borrador aparece en el panel del día y Escape también cierra guardándolo', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })
    await user.click(await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' }))
    await user.click(screen.getByRole('button', { name: '← Volver' }))
    const panel = screen.getByRole('dialog', { name: /Eventos del/ })
    await user.click(within(panel).getByRole('button', { name: 'Agregar evento' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo evento' })
    fireEvent.change(within(dialog).getByLabelText(/Título/i), { target: { value: 'Llevar la mochila azul' } })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Nuevo evento' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' }))
    await user.click(screen.getByRole('button', { name: '← Volver' }))
    expect(screen.getByText('Borrador sin guardar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seguir el borrador' })).toBeInTheDocument()
    expect(screen.getByText('Llevar la mochila azul')).toBeInTheDocument()
  })

  it('desde el formulario de edición se puede eliminar el evento', async () => {
    const user = userEvent.setup()
    renderCalendario({ id: docenteId, nombre: 'Lucía' })
    await user.click(await screen.findByRole('button', { name: 'Ver evento: Acto del Día de la Tradición' }))
    await user.click(screen.getByRole('button', { name: 'Editar Acto del Día de la Tradición' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar evento' })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar evento' }))
    await waitFor(() => {
      expect(cliente.delete).toHaveBeenCalledWith(`/proyectos/${proyectoId}/eventos/ev-propio`)
    })
    expect(await screen.findByText('Evento eliminado correctamente.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Editar evento' })).not.toBeInTheDocument()
  })
})

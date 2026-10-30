import { fireEvent, render, screen, within } from '@testing-library/react'
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

const observacionAntigua = {
  id: 'obs-1',
  proyectoId,
  autorId: autorDosId,
  tipo: 'OBSERVACION',
  titulo: 'Compartió el recreo tranquilo',
  contenido: 'Compartió el recreo tranquilo con dos compañeros.',
  datos: JSON.stringify({
    fecha: '2026-10-18T10:15:00-03:00',
    contexto: 'ESCUELA',
    etiquetas: ['SOCIAL', 'COMUNICACION'],
  }),
  visibilidad: 'TODOS',
  archivado: false,
  creadoEn: '2026-10-18T13:15:00Z',
  actualizadoEn: '2026-10-18T13:15:00Z',
  puedeEditar: false,
}

const observacionReciente = {
  id: 'obs-2',
  proyectoId,
  autorId: autorUnoId,
  tipo: 'OBSERVACION',
  titulo: 'Avisó cuando necesitó descansar',
  contenido: 'Avisó con pictogramas cuando necesitó descansar en casa.',
  datos: JSON.stringify({
    fecha: '2026-10-22T18:30:00-03:00',
    contexto: 'CASA',
    etiquetas: ['LOGRO', 'CONDUCTA'],
  }),
  visibilidad: 'TODOS',
  archivado: false,
  creadoEn: '2026-10-22T21:30:00Z',
  actualizadoEn: '2026-10-22T21:30:00Z',
  puedeEditar: true,
}

let bitacoraActual = []

function abrirBitacora(autenticado = true) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/bitacora`]}>
      <AuthContext.Provider
        value={{
          usuario: autenticado
            ? { id: autorUnoId, nombre: 'Marta', apellido: 'Fernández' }
            : null,
          estado: autenticado ? 'autenticado' : 'anonimo',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Bitácora de observaciones (Tarea 4.0)', () => {
  beforeEach(() => {
    bitacoraActual = [observacionAntigua, observacionReciente]

    cliente.get.mockReset().mockImplementation(async (ruta) => {
      if (ruta.endsWith('/bitacora')) {
        return { data: bitacoraActual }
      }
      if (ruta.endsWith('/miembros')) {
        return { data: miembrosMock }
      }
      return { data: proyectoMock }
    })

    cliente.post.mockReset().mockImplementation(async (_ruta, payload) => {
      const creada = {
        id: 'obs-nueva',
        proyectoId,
        autorId: autorUnoId,
        ...payload,
        archivado: false,
        creadoEn: '2026-10-24T14:00:00Z',
        actualizadoEn: '2026-10-24T14:00:00Z',
        puedeEditar: true,
      }
      bitacoraActual = [creada, ...bitacoraActual]
      return { data: creada }
    })
  })

  it('muestra las observaciones ordenadas por fecha (la más nueva arriba) con autor, fecha, contexto y etiquetas', async () => {
    abrirBitacora()

    expect(
      await screen.findByRole('heading', { name: 'Bitácora', level: 2 }),
    ).toBeInTheDocument()
    expect(document.title).toBe('TRAMA · Bitácora')

    const articulos = screen.getAllByRole('article')
    expect(articulos).toHaveLength(2)

    // Primera tarjeta: la más nueva (22/10/2026)
    expect(
      within(articulos[0]).getByText(
        'Avisó con pictogramas cuando necesitó descansar en casa.',
      ),
    ).toBeInTheDocument()
    expect(within(articulos[0]).getByText('Marta Fernández')).toBeInTheDocument()
    expect(within(articulos[0]).getByText('Casa')).toBeInTheDocument()
    expect(within(articulos[0]).getByText('Logro')).toBeInTheDocument()
    expect(within(articulos[0]).getByText('Conducta')).toBeInTheDocument()
    expect(articulos[0].querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-22T18:30:00-03:00',
    )

    // Segunda tarjeta: la más antigua (18/10/2026)
    expect(
      within(articulos[1]).getByText(
        'Compartió el recreo tranquilo con dos compañeros.',
      ),
    ).toBeInTheDocument()
    expect(within(articulos[1]).getByText('María Díaz')).toBeInTheDocument()
    expect(within(articulos[1]).getByText('Escuela')).toBeInTheDocument()
    expect(within(articulos[1]).getByText('Social')).toBeInTheDocument()
    expect(within(articulos[1]).getByText('Comunicación')).toBeInTheDocument()
  })

  it('valida contexto, al menos una etiqueta y texto antes de guardar una nueva observación', async () => {
    abrirBitacora()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Nueva observación' }),
    )

    const campoFecha = screen.getByLabelText('Fecha y hora')
    expect(campoFecha.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)

    // Intenta guardar sin elegir contexto
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar observación' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /elegí el contexto/i,
    )

    // Elige contexto pero todavía no selecciona etiquetas
    await userEvent.selectOptions(
      screen.getByLabelText('Contexto'),
      'CONSULTORIO',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar observación' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /al menos una etiqueta/i,
    )

    // Selecciona una etiqueta pero falta el texto
    await userEvent.click(screen.getByRole('checkbox', { name: 'Logro' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar observación' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /escribí el texto de la observación/i,
    )
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('permite editar la fecha y hora por defecto y cargar una observación nueva en la bitácora', async () => {
    abrirBitacora()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Nueva observación' }),
    )

    const campoFecha = screen.getByLabelText('Fecha y hora')
    fireEvent.change(campoFecha, { target: { value: '2026-10-24T11:45' } })
    expect(campoFecha).toHaveValue('2026-10-24T11:45')

    await userEvent.selectOptions(
      screen.getByLabelText('Contexto'),
      'CONSULTORIO',
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Logro' }))
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Comunicación' }),
    )

    fireEvent.change(screen.getByLabelText('Texto de la observación'), {
      target: {
        value: 'Armó una frase nueva durante la sesión de fonoaudiología.',
      },
    })

    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar observación' }),
    )

    expect(await screen.findByText('Observación guardada.')).toBeInTheDocument()
    expect(cliente.post).toHaveBeenCalledTimes(1)

    const [rutaLlamada, payloadEnviado] = cliente.post.mock.calls[0]
    expect(rutaLlamada).toBe(`/proyectos/${proyectoId}/aportes`)
    expect(payloadEnviado.tipo).toBe('OBSERVACION')
    expect(payloadEnviado.contenido).toBe(
      'Armó una frase nueva durante la sesión de fonoaudiología.',
    )

    const datosEnviados = JSON.parse(payloadEnviado.datos)
    expect(datosEnviados.contexto).toBe('CONSULTORIO')
    expect(datosEnviados.etiquetas).toEqual(['LOGRO', 'COMUNICACION'])
    expect(datosEnviados.fecha).toMatch(/^2026-10-24T11:45:00/)

    const articulos = screen.getAllByRole('article')
    expect(articulos).toHaveLength(3)
    expect(
      within(articulos[0]).getByText(
        'Armó una frase nueva durante la sesión de fonoaudiología.',
      ),
    ).toBeInTheDocument()
    expect(within(articulos[0]).getByText('Consultorio')).toBeInTheDocument()
  })

  it('muestra error de acceso denegado (403) si el usuario no es miembro del proyecto', async () => {
    cliente.get.mockRejectedValue({ response: { status: 403 } })
    abrirBitacora()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver este proyecto.',
    )
    expect(
      screen.queryByRole('button', { name: 'Nueva observación' }),
    ).not.toBeInTheDocument()
  })
})


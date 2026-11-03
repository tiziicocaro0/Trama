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
const docenteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'

const proyectoProfesional = {
  id: proyectoId,
  nombre: 'Tomás',
  apellido: 'Ejemplo',
  apodo: 'Tomi',
  fechaNacimiento: '2018-05-12',
  puedeCargar: true,
  puedeCargarNotas: true,
}

const miembrosMock = [
  {
    id: 'membresia-2',
    usuarioId: docenteId,
    nombre: 'María',
    apellido: 'Díaz',
    rol: 'EDUCACION',
    esAdmin: false,
  },
]

const observacion = {
  id: 'obs-1',
  proyectoId,
  autorId: docenteId,
  tipo: 'OBSERVACION',
  titulo: 'Compartió el recreo',
  contenido: 'Compartió el recreo tranquilo con dos compañeros.',
  datos: JSON.stringify({
    fecha: '2026-10-18T10:15:00-03:00',
    contexto: 'ESCUELA',
    etiquetas: ['SOCIAL'],
  }),
  visibilidad: 'TODOS',
  creadoEn: '2026-10-18T13:15:00Z',
  puedeEditar: true,
}

const registroAbc = {
  id: 'abc-1',
  proyectoId,
  autorId: docenteId,
  tipo: 'ABC',
  titulo: 'Sonó el timbre del recreo sin aviso.',
  contenido: 'Se tapó los oídos.',
  datos: JSON.stringify({
    antecedente: 'Sonó el timbre del recreo sin aviso.',
    conducta: 'Se tapó los oídos.',
    consecuencia: 'Salimos al patio y se calmó.',
    fecha: '2026-10-20T10:30:00-03:00',
    contexto: 'ESCUELA',
  }),
  visibilidad: 'TODOS',
  creadoEn: '2026-10-20T13:30:00Z',
  puedeEditar: true,
}

let proyectoActual
let bitacoraActual

function abrirBitacora() {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/bitacora`]}>
      <AuthContext.Provider
        value={{
          usuario: { id: docenteId, nombre: 'María', apellido: 'Díaz' },
          estado: 'autenticado',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Registro ABC en la bitácora (Tarea 4.4)', () => {
  beforeEach(() => {
    proyectoActual = proyectoProfesional
    bitacoraActual = [observacion, registroAbc]

    cliente.get.mockReset().mockImplementation(async (ruta) => {
      if (ruta.endsWith('/bitacora')) return { data: bitacoraActual }
      if (ruta.endsWith('/miembros')) return { data: miembrosMock }
      return { data: proyectoActual }
    })

    cliente.post.mockReset().mockImplementation(async (_ruta, payload) => {
      const creado = {
        id: 'abc-nuevo',
        proyectoId,
        autorId: docenteId,
        ...payload,
        creadoEn: '2026-10-24T14:00:00Z',
        puedeEditar: true,
      }
      bitacoraActual = [creado, ...bitacoraActual]
      return { data: creado }
    })
  })

  it('muestra el registro ABC con una etiqueta distinta y los bloques Antes, Qué pasó y Después', async () => {
    abrirBitacora()

    await screen.findByRole('heading', { name: 'Bitácora', level: 2 })
    const articulos = screen.getAllByRole('article')
    expect(articulos).toHaveLength(2)

    // El ABC (20/10) va arriba de la observación (18/10)
    const tarjetaAbc = articulos[0]
    expect(within(tarjetaAbc).getByText('Registro ABC')).toBeInTheDocument()
    expect(within(tarjetaAbc).getByText('Antes')).toBeInTheDocument()
    expect(
      within(tarjetaAbc).getByText('Sonó el timbre del recreo sin aviso.'),
    ).toBeInTheDocument()
    expect(within(tarjetaAbc).getByText('Qué pasó')).toBeInTheDocument()
    expect(within(tarjetaAbc).getByText('Se tapó los oídos.')).toBeInTheDocument()
    expect(within(tarjetaAbc).getByText('Después')).toBeInTheDocument()
    expect(
      within(tarjetaAbc).getByText('Salimos al patio y se calmó.'),
    ).toBeInTheDocument()

    // La observación común no lleva la etiqueta del ABC
    expect(
      within(articulos[1]).queryByText('Registro ABC'),
    ).not.toBeInTheDocument()
  })

  it('un profesional carga un registro ABC con los tres campos y queda visible para toda la red', async () => {
    abrirBitacora()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Registro ABC' }),
    )
    const formulario = screen.getByRole('form', { name: 'Registro ABC' })

    // No deja guardar con campos vacíos
    await userEvent.click(
      within(formulario).getByRole('button', { name: 'Guardar registro' }),
    )
    expect(await within(formulario).findByRole('alert')).toHaveTextContent(
      'Completá el campo "Antes".',
    )
    expect(cliente.post).not.toHaveBeenCalled()

    fireEvent.change(within(formulario).getByLabelText('Antes'), {
      target: { value: 'Cambiaron la rutina de la mañana.' },
    })
    fireEvent.change(within(formulario).getByLabelText('Qué pasó'), {
      target: { value: 'Lloró y no quiso entrar al aula.' },
    })
    fireEvent.change(within(formulario).getByLabelText('Después'), {
      target: { value: 'Le mostramos la agenda visual y entró.' },
    })
    await userEvent.selectOptions(
      within(formulario).getByLabelText('Dónde pasó'),
      'ESCUELA',
    )
    fireEvent.change(within(formulario).getByLabelText('Fecha y hora'), {
      target: { value: '2026-10-24T08:15' },
    })

    await userEvent.click(
      within(formulario).getByRole('button', { name: 'Guardar registro' }),
    )

    expect(await screen.findByText('Registro ABC guardado.')).toBeInTheDocument()
    expect(cliente.post).toHaveBeenCalledTimes(1)

    const [ruta, payload] = cliente.post.mock.calls[0]
    expect(ruta).toBe(`/proyectos/${proyectoId}/aportes`)
    expect(payload.tipo).toBe('ABC')
    expect(payload.visibilidad).toBe('TODOS')
    expect(payload.titulo).toBe('Cambiaron la rutina de la mañana.')

    const datos = JSON.parse(payload.datos)
    expect(datos.antecedente).toBe('Cambiaron la rutina de la mañana.')
    expect(datos.conducta).toBe('Lloró y no quiso entrar al aula.')
    expect(datos.consecuencia).toBe('Le mostramos la agenda visual y entró.')
    expect(datos.contexto).toBe('ESCUELA')
    expect(datos.fecha).toMatch(/^2026-10-24T08:15:00/)

    expect(
      await screen.findByText('Lloró y no quiso entrar al aula.'),
    ).toBeInTheDocument()
  })

  it('no muestra el botón "Registro ABC" a quien no es profesional', async () => {
    proyectoActual = { ...proyectoProfesional, puedeCargarNotas: false }
    abrirBitacora()

    expect(
      await screen.findByRole('button', { name: 'Nueva observación' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Registro ABC' }),
    ).not.toBeInTheDocument()
  })
})


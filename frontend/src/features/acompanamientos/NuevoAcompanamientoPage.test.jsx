import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn() },
}))

const id = 'e5f53072-2e3a-4b53-8ee1-6c218d7d5730'
const proyecto = {
  id,
  nombre: 'Luz ficticia',
  apellido: 'Ejemplo',
  fechaNacimiento: '2018-05-12',
}
const sesion = {
  usuario: { nombre: 'Tutora ficticia' },
  estado: 'autenticado',
  cerrarSesion: vi.fn(),
}

function abrir(ruta = '/acompanamientos/nuevo', auth = sesion) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={auth}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function completar() {
  for (const [nombre, valor] of [
    ['Nombre', 'Luz ficticia'],
    ['Apellido', 'Ejemplo'],
    ['Escuela', 'Escuela ficticia'],
    ['Grado', '2.º'],
    ['Fecha de nacimiento', '2018-05-12'],
  ]) {
    fireEvent.change(screen.getByLabelText(nombre, { exact: true }), {
      target: { value: valor },
    })
  }
  fireEvent.click(screen.getByRole('checkbox'))
}

beforeEach(() => {
  cliente.defaults.baseURL = '/api'
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data:
      ruta === '/proyectos'
        ? []
        : ruta.endsWith('/aportes')
          ? []
          : proyecto,
  }))
  cliente.post.mockReset().mockResolvedValue({ data: proyecto })
})

describe('Alta real de acompañamiento', () => {
  it('permite crear desde la lista vacía y abrir el perfil con el UUID recibido', async () => {
    const user = userEvent.setup()
    abrir('/acompanamientos')
    await screen.findByRole('heading', {
      name: 'Todavía no tenés acompañamientos',
    })
    await user.click(screen.getByRole('link', { name: 'Nuevo acompañamiento' }))
    completar()
    await user.click(
      screen.getByRole('button', { name: 'Crear acompañamiento' }),
    )
    expect(cliente.post).toHaveBeenCalledExactlyOnceWith('/proyectos', {
      nombre: 'Luz ficticia',
      apellido: 'Ejemplo',
      apodo: '',
      fechaNacimiento: '2018-05-12',
      escuela: 'Escuela ficticia',
      grado: '2.º',
      consentimiento: true,
    })
    expect(
      await screen.findByRole('heading', { name: 'Luz ficticia', level: 1 }),
    ).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${id}`, {
      signal: expect.any(AbortSignal),
    })
    expect(
      screen.getByRole('heading', { name: 'Fortalezas' }),
    ).toBeInTheDocument()
  })

  it('exige campos obligatorios y consentimiento sin enviar solicitudes', () => {
    abrir()
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(screen.getByLabelText('Nombre', { exact: true })).toHaveFocus()
    expect(screen.getAllByText('Completá este dato.')).toHaveLength(5)
    expect(
      screen.getByText('Necesitamos tu autorización para continuar.'),
    ).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('rechaza una fecha futura y mantiene los datos cargados', () => {
    abrir()
    completar()
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '2999-01-01' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(
      screen.getByText('Ingresá una fecha válida que no sea futura.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre', { exact: true })).toHaveValue(
      'Luz ficticia',
    )
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('rechaza campos que contienen solo espacios', () => {
    abrir()
    completar()
    fireEvent.change(screen.getByLabelText('Nombre', { exact: true }), {
      target: { value: '   ' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(screen.getByText('Completá este dato.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it.each([400, 401, 403, 500, undefined])(
    'muestra error %s sin fingir un guardado ni perder valores',
    async (status) => {
      cliente.post.mockRejectedValue({
        response: status ? { status } : undefined,
      })
      abrir()
      completar()
      fireEvent.submit(
        screen.getByRole('form', { name: 'Crear acompañamiento' }),
      )
      await screen.findByRole('alert')
      expect(screen.getByLabelText('Nombre', { exact: true })).toHaveValue(
        'Luz ficticia',
      )
      expect(
        screen.queryByRole('heading', { name: 'Fortalezas' }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Crear acompañamiento' }),
      ).toBeEnabled()
    },
  )

  it('9.4: si ya tiene 2 niños explica el tope y cómo pedir otro', async () => {
    cliente.post.mockRejectedValue({
      response: { status: 409, data: { codigo: 'LIMITE_NINOS' } },
    })
    abrir()
    completar()
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cada cuenta puede crear hasta 2 acompañamientos.',
    )
  })

  it('bloquea envíos duplicados mientras se guarda', async () => {
    let rechazar
    cliente.post.mockReturnValue(
      new Promise((resolve, reject) => {
        rechazar = reject
      }),
    )
    abrir()
    completar()
    const formulario = screen.getByRole('form', {
      name: 'Crear acompañamiento',
    })
    fireEvent.submit(formulario)
    fireEvent.submit(formulario)
    expect(cliente.post).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Creando acompañamiento…' }),
    ).toBeDisabled()
    await act(async () => rechazar(new Error('Sin conexión')))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Revisá tus acompañamientos',
    )
  })

  it('permite cancelar sin crear un proyecto', async () => {
    abrir()
    await userEvent.click(
      screen.getByRole('link', { name: 'Volver a acompañamientos' }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Todavía no tenés acompañamientos',
      }),
    ).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('no envía sin configuración de la API', async () => {
    cliente.defaults.baseURL = ''
    abrir()
    completar()
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('VITE_API_URL')
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('no abre un perfil si el servidor no devuelve un identificador', async () => {
    cliente.post.mockResolvedValue({ data: {} })
    abrir()
    completar()
    fireEvent.submit(screen.getByRole('form', { name: 'Crear acompañamiento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No recibimos la confirmación',
    )
    expect(cliente.get).not.toHaveBeenCalled()
  })

  it('protege el acceso directo al formulario', () => {
    abrir('/acompanamientos/nuevo', { usuario: null, estado: 'anonimo' })
    expect(
      screen.getByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('form', { name: 'Crear acompañamiento' }),
    ).not.toBeInTheDocument()
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cliente, { guardarToken, obtenerToken } from '../../api/cliente.js'
import AuthProvider from './AuthProvider.jsx'
import AppRoutes from '../../routes/AppRoutes.jsx'

const identidad = {
  id: 'd171881e-f32d-4acb-b08b-f100290cd6a5',
  nombre: 'Nora',
  apellido: 'Ejemplo',
  email: 'nora@trama.test',
}
const adapterOriginal = cliente.defaults.adapter
const baseOriginal = cliente.defaults.baseURL
let peticiones
let fallarLogin
let fallarIdentidad

function jwt(segundos = 3600) {
  return `cabecera.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundos }))}.firma-ficticia`
}

function respuesta(config, data, status = 200) {
  return { config, data, status, statusText: 'Simulado', headers: {} }
}

beforeEach(() => {
  guardarToken(null)
  fallarLogin = false
  fallarIdentidad = false
  peticiones = []
  cliente.defaults.baseURL = 'http://localhost:4002/api'
  cliente.defaults.adapter = async (config) => {
    peticiones.push(config)
    if (
      (config.url === '/auth/login' && fallarLogin) ||
      (config.url === '/auth/yo' && fallarIdentidad)
    ) {
      throw new AxiosError(
        'Rechazo simulado',
        undefined,
        config,
        {},
        respuesta(config, { codigo: 'NO_AUTENTICADO' }, 401),
      )
    }
    if (config.url === '/auth/yo') return respuesta(config, identidad)
    return respuesta(
      config,
      { access_token: jwt(), nombre: 'No usar esta identidad' },
      config.url === '/auth/registro' ? 201 : 200,
    )
  }
})

afterEach(() => {
  guardarToken(null)
  cliente.defaults.adapter = adapterOriginal
  cliente.defaults.baseURL = baseOriginal
  vi.useRealTimers()
})

function abrir(ruta = '/login') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function login(user) {
  await user.type(screen.getByLabelText('Email'), 'NORA@trama.test')
  await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('Flujo integrado de autenticación con transporte Axios simulado', () => {
  it('registra, verifica la identidad y entra automáticamente sin un POST de login', async () => {
    const user = userEvent.setup()
    abrir('/registro')
    await user.type(screen.getByLabelText('Nombre'), 'Nora')
    await user.type(screen.getByLabelText('Apellido'), 'Ejemplo')
    await user.type(screen.getByLabelText('Email'), identidad.email)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(
      await screen.findByRole('heading', { name: 'Hola, Nora.' }),
    ).toBeInTheDocument()
    expect(peticiones.map(({ url }) => url)).toEqual([
      '/auth/registro',
      '/auth/yo',
    ])
    expect(peticiones[1].headers.get('Authorization')).toBe(
      `Bearer ${obtenerToken()}`,
    )
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
  })

  it('inicia sesión con el payload real y obtiene la identidad desde /auth/yo', async () => {
    const user = userEvent.setup()
    abrir()
    await login(user)
    expect(
      await screen.findByRole('heading', { name: 'Hola, Nora.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(identidad.email)).not.toBeInTheDocument()
    expect(JSON.parse(peticiones[0].data)).toEqual({
      email: 'nora@trama.test',
      password: 'Prueba123!',
    })
    expect(peticiones[0].headers.get('Authorization')).toBeUndefined()
    expect(screen.queryByText('No usar esta identidad')).not.toBeInTheDocument()
    expect(
      screen.getByText(/los acompañamientos y eventos son ficticios/),
    ).toBeInTheDocument()
  })

  it('rechaza credenciales incorrectas y no crea una sesión', async () => {
    fallarLogin = true
    const user = userEvent.setup()
    abrir()
    await login(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El email o la contraseña no son correctos.',
    )
    expect(obtenerToken()).toBeNull()
    expect(peticiones).toHaveLength(1)
  })

  it('protege /inicio, valida los campos y permite mostrar y ocultar la contraseña', async () => {
    const user = userEvent.setup()
    abrir('/inicio')
    expect(
      await screen.findByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByLabelText('Email')).toHaveFocus()
    await user.type(screen.getByLabelText('Email'), 'incorrecto')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Ingresá un email válido.',
    )
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'type',
      'password',
    )
    expect(peticiones).toHaveLength(0)
  })

  it.each(['/', '/login', '/registro'])(
    'redirige una sesión verificada desde %s a Inicio',
    async (ruta) => {
      guardarToken(jwt())
      abrir(ruta)
      expect(screen.getByRole('status')).toHaveTextContent(
        'Verificando tu sesión',
      )
      expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
      expect(
        await screen.findByRole('heading', { name: 'Hola, Nora.' }),
      ).toBeInTheDocument()
    },
  )

  it('cierra sesión y una nueva carga de /inicio vuelve al login', async () => {
    const user = userEvent.setup()
    guardarToken(jwt())
    const vista = abrir('/inicio')
    await screen.findByRole('heading', { name: 'Hola, Nora.' })
    await user.click(
      screen.getAllByRole('button', { name: 'Cerrar sesión' })[0],
    )
    expect(
      await screen.findByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(obtenerToken()).toBeNull()
    vista.unmount()
    abrir('/inicio')
    expect(
      await screen.findByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(peticiones).toHaveLength(1)
  })

  it('un 401 de una petición autenticada elimina la sesión', async () => {
    guardarToken(jwt())
    abrir('/inicio')
    await screen.findByRole('heading', { name: 'Hola, Nora.' })
    fallarIdentidad = true
    await act(async () => {
      await expect(cliente.get('/auth/yo')).rejects.toMatchObject({
        response: { status: 401 },
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(obtenerToken()).toBeNull()
  })

  it('cierra automáticamente una sesión cuando llega exp', async () => {
    vi.useFakeTimers()
    guardarToken(jwt(3))
    abrir('/inicio')
    await act(async () => {})
    expect(
      screen.getByRole('heading', { name: 'Hola, Nora.' }),
    ).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(
      screen.getByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión venció.')
  })

  it('no da acceso con un JWT malformado', async () => {
    cliente.defaults.adapter = async (config) =>
      respuesta(config, { access_token: 'invalido' }, 201)
    guardarToken('invalido')
    abrir('/inicio')
    expect(
      await screen.findByRole('heading', { name: 'Hola de nuevo' }),
    ).toBeInTheDocument()
    expect(obtenerToken()).toBeNull()
  })

  it('evita duplicar el POST de login mientras está pendiente', async () => {
    let resolver
    cliente.defaults.adapter = (config) => {
      peticiones.push(config)
      return new Promise((resolve) => {
        resolver = () =>
          resolve(respuesta(config, { access_token: 'invalido' }))
      })
    }
    const user = userEvent.setup()
    abrir()
    await user.type(screen.getByLabelText('Email'), identidad.email)
    await user.type(screen.getByLabelText('Contraseña'), 'Prueba123!')
    const form = screen.getByRole('form', { name: 'Iniciar sesión' })
    fireEvent.submit(form)
    fireEvent.submit(form)
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'Ingresando…' })).toBeDisabled()
    expect(peticiones).toHaveLength(1)
    await act(async () => {
      resolver()
    })
  })
})

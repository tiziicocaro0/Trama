import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import cliente, { guardarToken, obtenerToken } from '../../api/cliente.js'
import AuthProvider from './AuthProvider.jsx'
import useAuth from '../../hooks/useAuth.js'

const identidad = {
  id: 'id-ficticio',
  nombre: 'Nora',
  apellido: 'Ejemplo',
  email: 'nora@trama.test',
}
const token = () =>
  `a.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }))}.c`

function Estado() {
  const { estado, usuario, reintentar, cerrarSesion } = useAuth()
  return (
    <>
      <p role="status">{estado}</p>
      {usuario && <p>{usuario.nombre}</p>}
      <button onClick={reintentar}>Reintentar</button>
      <button onClick={() => cerrarSesion()}>Salir</button>
    </>
  )
}

afterEach(() => {
  guardarToken(null)
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Verificación confiable de identidad', () => {
  it('bloquea el acceso ante un fallo de red y reintenta solamente la consulta de identidad', async () => {
    guardarToken(token())
    const get = vi
      .spyOn(cliente, 'get')
      .mockRejectedValue(new Error('Red simulada'))
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    )
    expect(await screen.findByText('sin-conexion')).toBeInTheDocument()
    expect(screen.queryByText('Nora')).not.toBeInTheDocument()
    get.mockResolvedValue({ data: identidad })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('autenticado')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('no restaura una sesión cerrada aunque llegue después una respuesta de identidad', async () => {
    guardarToken(token())
    let resolver
    vi.spyOn(cliente, 'get').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('verificando')
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    await act(async () => {
      resolver({ data: identidad })
    })
    expect(screen.getByRole('status')).toHaveTextContent('anonimo')
    expect(screen.queryByText('Nora')).not.toBeInTheDocument()
    expect(obtenerToken()).toBeNull()
  })

  it('descarta un JWT que vence mientras el backend verifica la identidad', async () => {
    vi.useFakeTimers()
    guardarToken(token())
    let resolver
    vi.spyOn(cliente, 'get').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve
        }),
    )
    render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    )
    vi.setSystemTime(Date.now() + 61000)
    await act(async () => {
      resolver({ data: identidad })
    })
    expect(screen.getByRole('status')).toHaveTextContent('anonimo')
    expect(obtenerToken()).toBeNull()
  })
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const id = '6a1c0d0e-7c55-4e8c-9b1a-1f2b3c4d5e6f'
const proyecto = { id, nombre: 'Pepe', fechaNacimiento: '2018-05-12', puedeCargar: true }

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta === `/proyectos/${id}` ? proyecto : ruta === '/proyectos' ? [] : [],
  }))
})

function abrir(ruta = `/proyectos/${id}`) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario: { id: 'u1', nombre: 'Tutora' }, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Perfil del niño con cabecera fija', () => {
  it('al cambiar de sección no vuelve a pedir el perfil ni a montar la cabecera', async () => {
    const user = userEvent.setup()
    abrir()
    const nombre = await screen.findByRole('heading', { name: 'Pepe', level: 1 })
    const botonera = screen.getByRole('navigation', { name: 'Espacios del perfil' })
    expect(within(botonera).getByRole('link', { name: 'Información general' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(botonera).getByRole('link', { name: 'Red' }))
    expect(await screen.findByRole('heading', { name: 'Red', level: 2 })).toBeInTheDocument()

    // Es el mismo elemento: la cabecera quedó montada y solo cambió el botón marcado
    expect(screen.getByRole('heading', { name: 'Pepe', level: 1 })).toBe(nombre)
    expect(within(botonera).getByRole('link', { name: 'Red' })).toHaveAttribute('aria-current', 'page')
    expect(within(botonera).getByRole('link', { name: 'Información general' })).not.toHaveAttribute('aria-current')
    const pedidosDelPerfil = cliente.get.mock.calls.filter(([ruta]) => ruta === `/proyectos/${id}`)
    expect(pedidosDelPerfil).toHaveLength(1)

    await user.click(within(botonera).getByRole('link', { name: 'Datos personales' }))
    expect(await screen.findByRole('heading', { name: 'Datos personales', level: 2 })).toBeInTheDocument()
    expect(cliente.get.mock.calls.filter(([ruta]) => ruta === `/proyectos/${id}`)).toHaveLength(1)
  })

  it('si el perfil no se puede ver, lo avisa y permite reintentar', async () => {
    cliente.get.mockRejectedValueOnce({ response: { status: 403 } })
    abrir(`/proyectos/${id}/red`)
    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso para ver este proyecto.')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Pepe', level: 1 })).toBeInTheDocument()
  })
})

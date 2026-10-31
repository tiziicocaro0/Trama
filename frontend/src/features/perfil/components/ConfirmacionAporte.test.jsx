import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthContext from '../../auth/AuthContext.js'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import cliente from '../../../api/cliente.js'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, post: vi.fn(), delete: vi.fn() },
}))

const yo = { id: 'u-yo', nombre: 'Marta', apellido: 'Fernández' }
const base = {
  id: 'a1',
  proyectoId: 'p1',
  autorId: 'u-otra',
  autorNombre: 'Elena Sosa',
  tipo: 'FORTALEZA',
  titulo: 'Arma rompecabezas',
  visibilidad: 'TODOS',
  confirmaciones: 0,
  yoConfirme: false,
  confirmadoPor: [],
}

function mostrar(aporte) {
  return render(
    <AuthContext.Provider value={{ usuario: yo }}>
      <TarjetaAporte aporte={{ ...base, ...aporte }} />
    </AuthContext.Provider>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('3.3: confirmar un aporte ajeno', () => {
  it('en un aporte de otro ofrece «Yo también lo observé» y suma mi nombre', async () => {
    cliente.post.mockResolvedValue({})
    mostrar({ confirmadoPor: ['Jorge Fernández'] })
    expect(screen.getByText('Lo confirmó: Jorge Fernández')).toBeVisible()

    const boton = screen.getByRole('button', { name: 'Yo también lo observé' })
    expect(boton).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(boton)

    expect(cliente.post).toHaveBeenCalledWith('/proyectos/p1/aportes/a1/confirmaciones')
    expect(boton).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText('Lo confirmaron 2 personas: Jorge Fernández, Marta Fernández'),
    ).toBeVisible()
  })

  it('en estrategias dice «A mí también me funcionó»', () => {
    mostrar({ tipo: 'ESTRATEGIA' })
    expect(screen.getByRole('button', { name: 'A mí también me funcionó' })).toBeVisible()
  })

  it('puedo quitar mi confirmación', async () => {
    cliente.delete.mockResolvedValue({})
    mostrar({ yoConfirme: true, confirmadoPor: ['Marta Fernández'] })
    await userEvent.click(screen.getByRole('button', { name: 'Yo también lo observé' }))
    expect(cliente.delete).toHaveBeenCalledWith('/proyectos/p1/aportes/a1/confirmaciones')
    expect(screen.queryByText(/Lo confirm/)).not.toBeInTheDocument()
  })

  it('en mis propios aportes no aparece el botón, pero sí quiénes lo confirmaron', () => {
    mostrar({ autorId: 'u-yo', confirmadoPor: ['Elena Sosa'] })
    expect(screen.queryByRole('button', { name: 'Yo también lo observé' })).not.toBeInTheDocument()
    expect(screen.getByText('Lo confirmó: Elena Sosa')).toBeVisible()
  })

  it('si falla lo avisa y no cambia el estado', async () => {
    cliente.post.mockRejectedValue({ response: { status: 400, data: { codigo: 'APORTE_PROPIO' } } })
    mostrar({})
    const boton = screen.getByRole('button', { name: 'Yo también lo observé' })
    await userEvent.click(boton)
    expect(await screen.findByRole('alert')).toHaveTextContent('No podés confirmar tu propio aporte.')
    expect(boton).toHaveAttribute('aria-pressed', 'false')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../../api/cliente.js'
import PermisosFamiliares from './PermisosFamiliares.jsx'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, put: vi.fn() },
}))

const proyecto = {
  id: '0f8b4fc3-e754-4707-8769-28d7210de226',
  nombre: 'Niño ficticio',
  familiarPuedeCargar: false,
  familiarVeNotas: true,
}

beforeEach(() => {
  cliente.put.mockReset().mockImplementation(async (_ruta, cuerpo) => ({
    data: { ...proyecto, ...cuerpo },
  }))
})

describe('1.8: qué pueden hacer los familiares', () => {
  it('muestra los dos interruptores con lo que tiene guardado el proyecto', () => {
    render(<PermisosFamiliares proyecto={proyecto} />)
    expect(screen.getByRole('switch', { name: /Cargar aportes/ })).not.toBeChecked()
    expect(screen.getByRole('switch', { name: /Ver las notas profesionales/ })).toBeChecked()
  })

  it('guarda los dos permisos juntos al cambiar uno', async () => {
    render(<PermisosFamiliares proyecto={proyecto} />)
    await userEvent.click(screen.getByRole('switch', { name: /Cargar aportes/ }))
    expect(cliente.put).toHaveBeenCalledExactlyOnceWith(
      `/proyectos/${proyecto.id}/configuracion`,
      { familiarPuedeCargar: true, familiarVeNotas: true },
    )
    expect(await screen.findByText('Guardamos el cambio.')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Cargar aportes/ })).toBeChecked()
  })

  it('si el servidor rechaza el cambio, vuelve como estaba y avisa', async () => {
    cliente.put.mockRejectedValue({ response: { data: { mensaje: 'No tenés permiso' } } })
    render(<PermisosFamiliares proyecto={proyecto} />)
    await userEvent.click(screen.getByRole('switch', { name: /Ver las notas profesionales/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso')
    expect(screen.getByRole('switch', { name: /Ver las notas profesionales/ })).toBeChecked()
  })
})

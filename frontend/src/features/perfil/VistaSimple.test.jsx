import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import SeccionVistaSimple from '../cuenta/SeccionVistaSimple.jsx'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const id = 'proyecto-ficticio'

function abrir(ruta, usuario) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith(`/proyectos/${id}`)
      ? { id, nombre: 'Valentina', apodo: 'Valen', fechaNacimiento: '2018-09-03', puedeCargar: true }
      : [],
  }))
  cliente.put.mockReset().mockResolvedValue({ data: { vistaSimple: true } })
})

describe('Vista simple para la familia (7.0)', () => {
  it('se activa desde Mi perfil y queda guardada en la cuenta', async () => {
    const onCambio = vi.fn()
    render(<SeccionVistaSimple usuario={{ vistaSimple: false }} onCambio={onCambio} />)
    const interruptor = screen.getByRole('switch', { name: /Vista simple/ })
    expect(interruptor).not.toBeChecked()
    await userEvent.click(interruptor)
    expect(cliente.put).toHaveBeenCalledWith('/usuarios/yo/vista-simple', { activa: true })
    expect(interruptor).toBeChecked()
    expect(onCambio).toHaveBeenCalled()
  })

  it('la portada muestra solo los cuatro botones grandes, sin pestañas ni buscador', async () => {
    abrir(`/proyectos/${id}`, { id: 'u1', nombre: 'Elena', vistaSimple: true })
    const conocelo = await screen.findByRole('link', { name: /Conocelo en 5 minutos/ })
    expect(conocelo).toHaveAttribute('href', `/proyectos/${id}/conocelo`)
    expect(screen.getByRole('link', { name: /Si se desregula/ })).toHaveAttribute('href', `/proyectos/${id}/desregulacion`)
    expect(screen.getByRole('link', { name: /^Hoy/ })).toHaveAttribute('href', `/proyectos/${id}/hoy`)
    expect(screen.getByRole('link', { name: /Cargar observación/ })).toHaveAttribute('href', `/proyectos/${id}/bitacora?nueva=1`)
    expect(screen.queryByRole('navigation', { name: /secciones/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abrir el buscador del perfil' })).not.toBeInTheDocument()
    expect(screen.queryByText('Información general')).not.toBeInTheDocument()
  })

  it('cargar una observación lleva directo al formulario abierto (paso 2 de 3)', async () => {
    abrir(`/proyectos/${id}/bitacora?nueva=1`, { id: 'u1', nombre: 'Elena', vistaSimple: true })
    const formulario = await screen.findByRole('form')
    expect(within(formulario).getByRole('button', { name: /Guardar/ })).toBeInTheDocument()
  })

  it('sin vista simple la portada es la de siempre', async () => {
    abrir(`/proyectos/${id}`, { id: 'u1', nombre: 'Laura', vistaSimple: false })
    expect((await screen.findAllByText('Información general')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /Cargar observación/ })).not.toBeInTheDocument()
  })
})

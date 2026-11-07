import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../../routes/AppRoutes.jsx'
import AuthContext from '../../auth/AuthContext.js'
import cliente from '../../../api/cliente.js'

vi.mock('../../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const id = '6a0d3c55-7d1b-4c0e-9f6e-2b2f7f4f1a10'
const proyecto = { id, nombre: 'Luz ficticia', fechaNacimiento: '2018-05-12', puedeCargar: true }

function abrir(rol, esAdmin) {
  cliente.get.mockImplementation(async (ruta, opciones) => {
    if (ruta === '/proyectos') return { data: [{ id, nombre: proyecto.nombre, rol, esAdmin }] }
    if (ruta.endsWith('/exportar')) {
      return { data: new Blob([opciones.params.formato], { type: 'application/octet-stream' }) }
    }
    return { data: ruta.endsWith('/miembros') ? [] : proyecto }
  })
  render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/datos-personales`]}>
      <AuthContext.Provider value={{ usuario: { nombre: 'Tutora' }, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

// El botón "Descargar PDF" abre la ventana de filtros; sin elegir nada, se exporta todo
async function descargarPdfDesdeLaVentana(user) {
  await user.click(await screen.findByRole('button', { name: 'Descargar PDF' }))
  const ventana = await screen.findByRole('dialog')
  await user.click(within(ventana).getByRole('button', { name: 'Descargar PDF' }))
}

beforeEach(() => {
  cliente.get.mockReset()
  window.URL.createObjectURL = vi.fn(() => 'blob:datos')
  window.URL.revokeObjectURL = vi.fn()
})

describe('8.1: descargar todos los datos', () => {
  it('un tutor (aunque no sea el administrador) descarga el PDF y el JSON', async () => {
    const user = userEvent.setup()
    const clics = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    abrir('TUTOR', false)
    await descargarPdfDesdeLaVentana(user)
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${id}/exportar`, {
      params: { formato: 'pdf' },
      responseType: 'blob',
    })
    expect(await screen.findByText('Descargamos los datos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Descargar JSON' }))
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${id}/exportar`, {
      params: { formato: 'json' },
      responseType: 'blob',
    })
    expect(clics).toHaveBeenCalledTimes(2)
    // El tutor que no es administrador no ve la zona para eliminar
    expect(screen.queryByRole('heading', { name: 'Eliminar perfil' })).not.toBeInTheDocument()
    clics.mockRestore()
  })

  it('si el servidor lo rechaza, avisa con un error', async () => {
    const user = userEvent.setup()
    abrir('TUTOR', true)
    const anterior = cliente.get.getMockImplementation()
    cliente.get.mockImplementation(async (ruta, opciones) => {
      if (ruta.endsWith('/exportar')) throw { response: { status: 500 } }
      return anterior(ruta, opciones)
    })
    await descargarPdfDesdeLaVentana(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos preparar la descarga. Intentá nuevamente.',
    )
  })

  it('los demás roles no ven la descarga', async () => {
    abrir('EDUCACION', false)
    await screen.findByRole('heading', { name: 'Datos personales' })
    expect(screen.queryByRole('heading', { name: 'Descargar todos los datos' })).not.toBeInTheDocument()
  })
})

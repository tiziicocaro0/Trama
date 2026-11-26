import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import TarjetaAporte from '../../components/ui/TarjetaAporte.jsx'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const id = 'proyecto-ficticio'
let lista

function abrirRutinas() {
  render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/rutinas`]}>
      <AuthContext.Provider value={{ usuario: { id: 'autor-1', nombre: 'Tutora ficticia' }, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  lista = []
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/aportes') ? lista : { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12', puedeCargar: true },
  }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => {
    if (ruta.endsWith('/archivos')) {
      return { data: { id: '11111111-1111-4111-8111-111111111111', nombreOriginal: 'cepillo.png', tipoMime: 'image/png', tamanoBytes: 900 } }
    }
    const aporte = { ...datos, id: 'rutina-nueva', proyectoId: id, puedeEditar: true }
    lista = [aporte]
    return { data: aporte }
  })
})

describe('Rutinas paso a paso (2.7)', () => {
  it('arma la rutina con pasos en orden, los reordena, suma una imagen y los guarda en datos', async () => {
    abrirRutinas()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    const formulario = screen.getByRole('form', { name: 'Agregar aporte en Rutinas' })
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Título del aporte' }), 'Noche antes de dormir')
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Descripción' }), 'Lo hace con la agenda en el baño')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Higiene y cuidado personal' }))
    await userEvent.click(within(formulario).getByRole('checkbox', { name: 'Casa' }))
    await userEvent.click(within(formulario).getByRole('checkbox', { name: /^Tutores/ }))

    await userEvent.click(within(formulario).getByRole('button', { name: 'Agregar paso' }))
    expect(within(formulario).getByRole('textbox', { name: 'Paso 1' })).toHaveFocus()
    await userEvent.keyboard('Lavarse los dientes')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Agregar paso' }))
    await userEvent.keyboard('Ponerse el pijama')

    // El pijama va primero: al subirlo, el foco sigue al paso movido
    await userEvent.click(within(formulario).getByRole('button', { name: 'Subir el paso 2' }))
    expect(within(formulario).getByRole('textbox', { name: 'Paso 1' })).toHaveValue('Ponerse el pijama')
    expect(within(formulario).getByRole('button', { name: 'Subir el paso 1' })).toBeDisabled()

    const imagen = new File(['imagen'], 'cepillo.png', { type: 'image/png' })
    fireEvent.change(within(formulario).getByLabelText('Agregar imagen al paso 2'), { target: { files: [imagen] } })
    expect(await within(formulario).findByText('cepillo.png')).toBeInTheDocument()

    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenLastCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({
      tipo: 'RUTINA',
      datos: JSON.stringify({
        categoria: 'HIGIENE_CUIDADO_PERSONAL',
        contextos: ['CASA'],
        pasos: [{ texto: 'Ponerse el pijama' }, { texto: 'Lavarse los dientes', archivoId: '11111111-1111-4111-8111-111111111111' }],
      }),
      archivoIds: ['11111111-1111-4111-8111-111111111111'],
    }))
  })

  it('no deja guardar un paso con imagen y sin texto', async () => {
    abrirRutinas()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    const formulario = screen.getByRole('form', { name: 'Agregar aporte en Rutinas' })
    await userEvent.click(within(formulario).getByRole('button', { name: 'Agregar paso' }))
    fireEvent.change(within(formulario).getByLabelText('Agregar imagen al paso 1'), { target: { files: [new File(['x'], 'mesa.png', { type: 'image/png' })] } })
    await within(formulario).findByText('cepillo.png')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(within(formulario).getByText('Escribí qué hay que hacer en cada paso con imagen.')).toBeInTheDocument()
    expect(cliente.post).toHaveBeenCalledTimes(1)
  })

  it('muestra los pasos en la tarjeta y los recorre de a uno con letra grande', async () => {
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:paso') })
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    cliente.get.mockResolvedValue({ data: new Blob(['imagen'], { type: 'image/png' }) })
    render(
      <TarjetaAporte
        aporte={{
          id: 'rutina-1',
          proyectoId: id,
          tipo: 'RUTINA',
          titulo: 'Mañana de escuela',
          contenido: 'Se prepara con la agenda',
          datos: JSON.stringify({ categoria: 'HIGIENE_CUIDADO_PERSONAL', pasos: [{ texto: 'Desayunar' }, { texto: 'Lavarse los dientes', archivoId: 'img-1' }] }),
          archivos: [{ id: 'img-1', nombreOriginal: 'cepillo.png', tipoMime: 'image/png' }],
        }}
      />,
    )

    // La imagen del paso no se repite como adjunto suelto
    expect(screen.queryByRole('button', { name: /Ver más grande/ })).not.toBeInTheDocument()
    const lista = screen.getByRole('list')
    expect(within(lista).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['1Desayunar', '2Lavarse los dientes'])

    const abrir = screen.getByRole('button', { name: 'Ver paso a paso: Mañana de escuela' })
    await userEvent.click(abrir)
    const vista = screen.getByRole('dialog', { name: 'Mañana de escuela' })
    expect(within(vista).getByText('Paso 1 de 2')).toBeInTheDocument()
    expect(within(vista).getByText('Desayunar')).toHaveClass('text-display')

    await userEvent.click(within(vista).getByRole('button', { name: /Siguiente/ }))
    expect(within(vista).getByText('Paso 2 de 2')).toBeInTheDocument()
    expect(await within(vista).findByRole('img', { name: 'Imagen del paso: Lavarse los dientes' })).toHaveAttribute('src', 'blob:paso')

    await userEvent.click(within(vista).getByRole('button', { name: 'Terminamos' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abrir).toHaveFocus()
  })
})

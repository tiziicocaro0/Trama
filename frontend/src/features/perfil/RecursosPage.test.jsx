import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const id = '6a1f2c3d-1111-4222-8333-444455556666'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }

const pictograma = {
  archivoId: 'archivo-imagen',
  nombreOriginal: 'pictograma.png',
  tipoMime: 'image/png',
  tamanoBytes: 2048,
  fecha: '2026-11-09T18:02:00Z',
  autorId: 'usuario-docente',
  autorNombre: 'Laura Gómez',
  autorTieneFoto: false,
  origen: 'APORTE',
  tipoAporte: 'FORTALEZA',
  aporteId: 'aporte-1',
  aporteTitulo: 'Arma rompecabezas',
  visibilidad: 'TODOS',
  puedeArchivar: false,
}

const agenda = {
  archivoId: 'archivo-pdf',
  nombreOriginal: 'agenda.pdf',
  tipoMime: 'application/pdf',
  tamanoBytes: 4096,
  fecha: '2026-11-08T13:30:00Z',
  autorId: 'usuario-tutora',
  autorNombre: 'Tutora Ejemplo',
  autorTieneFoto: false,
  origen: 'RECURSO',
  tipoAporte: null,
  aporteId: null,
  aporteTitulo: null,
  visibilidad: 'TODOS',
  puedeArchivar: true,
}

function abrir(ruta = `/proyectos/${id}/recursos`) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario: { nombre: 'Tutora' }, estado: 'autenticado' }}>
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

function simularApi({ recursos = [pictograma, agenda], puedeCargar = true } = {}) {
  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta.endsWith('/archivos')) return { data: recursos }
    if (ruta.includes('/archivos/')) {
      return { data: new Blob(['imagen'], { type: 'image/png' }), headers: { 'content-type': 'image/png' } }
    }
    if (ruta.endsWith('/aportes') || ruta.endsWith('/miembros')) return { data: [] }
    return { data: { ...proyecto, puedeCargar } }
  })
}

beforeEach(() => {
  window.URL.createObjectURL = vi.fn(() => 'blob:recurso')
  window.URL.revokeObjectURL = vi.fn()
  simularApi()
  cliente.post.mockReset()
})

describe('Recursos del niño', () => {
  it('se abre desde el perfil, junto a Red y Datos personales', async () => {
    abrir(`/proyectos/${id}`)
    const nav = await screen.findByRole('navigation', { name: 'Espacios del perfil' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Recursos' }))
    expect(await screen.findByRole('heading', { name: 'Recursos', level: 2 })).toBeInTheDocument()
  })

  it('muestra la galería con dónde se cargó cada archivo y quién lo subió', async () => {
    abrir()
    expect(
      await screen.findByRole('button', { name: 'pictograma.png. Cargado en Fortalezas por Laura Gómez' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'agenda.pdf. Cargado en Recursos por Tutora Ejemplo' }),
    ).toBeInTheDocument()
  })

  it('al tocar una foto la agranda con quién la subió, la fecha y la hora y dónde se cargó', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: /^pictograma\.png/ }))

    const visor = screen.getByRole('dialog')
    expect(await within(visor).findByRole('img', { name: 'pictograma.png' })).toHaveAttribute('src', 'blob:recurso')
    expect(within(visor).getByText('Laura Gómez')).toBeInTheDocument()
    expect(within(visor).getByText(/9 de noviembre de 2026/)).toBeInTheDocument()
    expect(within(visor).getByRole('link', { name: 'Fortalezas' })).toHaveAttribute(
      'href',
      `/proyectos/${id}/fortalezas`,
    )
    expect(within(visor).getByText('Arma rompecabezas')).toBeInTheDocument()
    // Un adjunto se archiva con su aporte, no desde acá
    expect(within(visor).queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument()
  })

  it('quien subió un recurso lo archiva después de confirmar', async () => {
    cliente.post.mockResolvedValue({})
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: /^agenda\.pdf/ }))
    const visor = screen.getByRole('dialog')

    await userEvent.click(within(visor).getByRole('button', { name: 'Archivar' }))
    expect(cliente.post).not.toHaveBeenCalled()
    await userEvent.click(within(visor).getByRole('button', { name: 'Sí, archivar' }))

    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/archivos/archivo-pdf/archivar`)
  })

  it('sube un recurso con la visibilidad elegida', async () => {
    cliente.post.mockResolvedValue({
      data: { id: 'archivo-nuevo', nombreOriginal: 'informe.pdf', tipoMime: 'application/pdf' },
    })
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Subir recurso' }))
    const modal = screen.getByRole('dialog', { name: 'Subir recurso' })

    await userEvent.click(within(modal).getByRole('button', { name: /^Elegir quién puede ver/ }))
    await userEvent.click(within(modal).getByRole('checkbox', { name: /^Toda la red/ }))
    await userEvent.click(within(modal).getByRole('checkbox', { name: /^Equipo de salud/ }))
    const pdf = new File(['%PDF-1.4'], 'informe.pdf', { type: 'application/pdf' })
    await userEvent.upload(within(modal).getByLabelText('Archivo'), pdf)

    expect(cliente.post).toHaveBeenCalledTimes(1)
    const [ruta, formulario] = cliente.post.mock.calls[0]
    expect(ruta).toBe(`/proyectos/${id}/archivos`)
    expect(formulario.get('visibilidad')).toBe('SOLO_SALUD')
    expect(formulario.get('archivo').name).toBe('informe.pdf')
  })

  it('sin permiso de carga no ofrece subir recursos', async () => {
    simularApi({ puedeCargar: false })
    abrir()
    await screen.findByRole('button', { name: /^pictograma\.png/ })
    expect(screen.queryByRole('button', { name: 'Subir recurso' })).not.toBeInTheDocument()
  })

  it('sin archivos explica qué va a aparecer en la galería', async () => {
    simularApi({ recursos: [] })
    abrir()
    expect(await screen.findByText(/Todavía no hay recursos/)).toBeInTheDocument()
  })
})

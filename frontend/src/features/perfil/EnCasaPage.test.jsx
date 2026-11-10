import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import EnCasaPage from './EnCasaPage.jsx'

vi.mock('../../api/cliente.js', () => ({
  default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const id = 'proyecto-ficticio'
const intereses = [
  { id: 'i-dino', tipo: 'INTERES', titulo: 'Los dinosaurios', puedeEditar: false },
  { id: 'i-mapas', tipo: 'INTERES', titulo: 'Los mapas', puedeEditar: false },
  { id: 'i-cocina', tipo: 'INTERES', titulo: 'Cocinar', puedeEditar: false },
]
const sugerencia = (sid, titulo, interesId, extra = {}) => ({
  id: sid, tipo: 'SUGERENCIA', titulo, contenido: `Cómo hacer ${titulo}`, puedeEditar: false,
  autorNombre: 'María Díaz', creadoEn: '2026-11-05T15:00:00Z', datos: JSON.stringify({ interesId, ...extra }),
})
let sugerencias
let proyecto

function abrir() {
  render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/en-casa`]}>
      <Routes><Route path="/proyectos/:id/en-casa" element={<EnCasaPage />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sugerencias = [
    sugerencia('s1', 'Contar dinosaurios', 'i-dino', { materiales: 'Muñecos' }),
    sugerencia('s2', 'Buscar el camino en el mapa', 'i-mapas'),
  ]
  proyecto = { id, nombre: 'Valentina', apodo: 'Valen', puedeCargar: true, puedeCargarNotas: false }
  cliente.get.mockReset().mockImplementation(async (ruta, config) => ({
    data: ruta.endsWith('/aportes') ? (config?.params?.tipo === 'INTERES' ? intereses : sugerencias) : proyecto,
  }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => ({ data: { ...datos, id: 'nueva', puedeEditar: true } }))
})

describe('Sugerencias para casa (7.2)', () => {
  it('la familia ve las sugerencias con autor, fecha e interés y las filtra por interés', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: 'Contar dinosaurios' })).toBeInTheDocument()
    expect(screen.getByText('Le gusta: Los dinosaurios')).toBeInTheDocument()
    expect(screen.getByText('Muñecos')).toBeInTheDocument()
    expect(screen.getAllByText(/María Díaz/).length).toBeGreaterThan(0)
    // La familia no puede cargar sugerencias
    expect(screen.queryByRole('button', { name: 'Sugerir actividad' })).not.toBeInTheDocument()

    const filtros = screen.getByRole('group', { name: 'Filtrar por interés' })
    // Solo aparecen los intereses que tienen sugerencias
    expect(within(filtros).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todas', 'Los dinosaurios', 'Los mapas'])
    await userEvent.click(within(filtros).getByRole('button', { name: 'Los mapas' }))
    expect(screen.queryByRole('heading', { name: 'Contar dinosaurios' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Buscar el camino en el mapa' })).toBeInTheDocument()
  })

  it('un profesional carga una actividad vinculada a un interés', async () => {
    proyecto.puedeCargarNotas = true
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Sugerir actividad' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar sugerencia' }))
    expect(screen.getByText('Elegí con qué interés se relaciona.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()

    await userEvent.type(screen.getByRole('textbox', { name: 'Actividad' }), 'Galletitas con formas')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '¿Con qué interés se relaciona?' }), 'Cocinar')
    await userEvent.type(screen.getByRole('textbox', { name: '¿Cómo hacerla en casa?' }), 'Cortar la masa con moldes')
    await userEvent.type(screen.getByRole('textbox', { name: /Materiales/ }), 'Moldes')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar sugerencia' }))

    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, {
      tipo: 'SUGERENCIA',
      titulo: 'Galletitas con formas',
      contenido: 'Cortar la masa con moldes',
      visibilidad: 'TODOS',
      datos: JSON.stringify({ interesId: 'i-cocina', materiales: 'Moldes' }),
    })
  })
})

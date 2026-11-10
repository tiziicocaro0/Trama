import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

// Las acciones de una tarjeta (editar, archivar, historial) están en sus tres puntitos
async function abrirOpciones(titulo) {
  const boton = await screen.findByRole('button', { name: `Más opciones: ${titulo}` })
  if (boton.getAttribute('aria-expanded') !== 'true') await userEvent.click(boton)
}

vi.mock('../../api/cliente.js', () => ({ default: { defaults: { baseURL: '/api' }, get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const id = '304d3b5e-8c8a-4a50-83d3-a84ade17b697'
const autorId = 'f8d9600c-34fe-4dd1-956e-f694e95aa730'
let lista
const aporte = { id: 'a1', proyectoId: id, autorId, autorNombre: 'Persona ficticia', tipo: 'COMUNICACION', titulo: 'Usa imágenes', contenido: 'Señala pictogramas', datos: JSON.stringify({ categoria: 'EXPRESION', formasComunicacion: ['PICTOGRAMAS'], comoHablarle: 'Frases cortas', queEvitar: 'Hablar rápido' }), visibilidad: 'TODOS', creadoEn: '2026-10-20T12:00:00Z', puedeEditar: true }

function abrir() {
  return render(<MemoryRouter initialEntries={[`/proyectos/${id}/comunicacion`]}><AuthContext.Provider value={{ usuario: { id: autorId }, estado: 'autenticado' }}><AppRoutes /></AuthContext.Provider></MemoryRouter>)
}

beforeEach(() => {
  lista = [aporte]
  cliente.get.mockReset().mockImplementation(async (ruta) => ({ data: ruta.endsWith('/aportes') ? lista : ruta.endsWith('/versiones') ? [{ numero: 1, actual: true, ...aporte, fechaCreacion: aporte.creadoEn }] : { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12', puedeCargar: true } }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => {
    if (ruta.endsWith('/archivar')) { lista = []; return { data: null } }
    const nuevo = { ...aporte, ...datos, id: 'a2' }
    lista = [nuevo, ...lista]
    return { data: nuevo }
  })
  cliente.put.mockReset().mockImplementation(async (_ruta, datos) => {
    lista = [{ ...aporte, ...datos }]
    return { data: lista[0] }
  })
})

describe('Comunicación', () => {
  it('carga la ruta, filtra datos reales y muestra autor y fecha', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: 'Usa imágenes' })).toBeInTheDocument()
    expect(screen.getByText(/Persona ficticia/)).toBeInTheDocument()
    expect(screen.getByText(/Frases cortas/)).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en comunicación' }), 'sin coincidencias')
    expect(screen.queryByRole('heading', { name: 'Usa imágenes' })).not.toBeInTheDocument()
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar en comunicación' }))
    await userEvent.click(screen.getByRole('button', { name: 'Comprensión' }))
    expect(screen.queryByRole('heading', { name: 'Usa imágenes' })).not.toBeInTheDocument()
  })

  it('exige Otra y los campos obligatorios antes de crear por la API', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    const formulario = screen.getByRole('form', { name: 'Agregar aporte en Comunicación' })
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Título' }), 'Nuevo aporte')
    await userEvent.click(within(formulario).getByRole('checkbox', { name: 'Otra' }))
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(screen.getByText('Contanos cuál es la otra forma.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
    await userEvent.click(within(formulario).getByRole('radio', { name: 'Expresión' }))
    await userEvent.click(within(formulario).getByRole('checkbox', { name: 'Verbal' }))
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Otra forma de comunicación' }), 'Tablero')
    await userEvent.type(within(formulario).getByRole('textbox', { name: '¿Cómo conviene hablarle?' }), 'Con calma')
    await userEvent.type(within(formulario).getByRole('textbox', { name: '¿Qué evitar?' }), 'Apurarlo')
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Descripción' }), 'Usa un tablero')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({ datos: expect.stringContaining('"OTRA"') }))
    expect(await screen.findByRole('heading', { name: 'Nuevo aporte' })).toBeInTheDocument()
  })

  it('edita, archiva y consulta historial real', async () => {
    abrir()
    await abrirOpciones('Usa imágenes')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar aporte: Usa imágenes' }))
    const formulario = screen.getByRole('form', { name: 'Editar aporte en Comunicación' })
    await userEvent.clear(within(formulario).getByRole('textbox', { name: '¿Qué evitar?' }))
    await userEvent.type(within(formulario).getByRole('textbox', { name: '¿Qué evitar?' }), 'Gritar')
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.put).toHaveBeenCalledWith(`/proyectos/${id}/aportes/a1`, expect.any(Object))
    await abrirOpciones('Usa imágenes')
    await userEvent.click(await screen.findByRole('button', { name: 'Ver historial del aporte: Usa imágenes' }))
    expect(await screen.findByRole('list', { name: 'Versiones del aporte' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
    await abrirOpciones('Usa imágenes')
    await userEvent.click(screen.getByRole('button', { name: 'Archivar aporte: Usa imágenes' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes/a1/archivar`)
  })
})

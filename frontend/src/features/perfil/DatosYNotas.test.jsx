import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'
import { hoyIso } from '../../utils/fechas.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))
const id = '4c849013-1eb3-442b-9ad8-41a462524b89'
const proyecto = {
  id,
  nombre: 'Luz ficticia',
  apellido: 'Ejemplo',
  apodo: 'Luli',
  fechaNacimiento: '2018-05-12',
  escuela: 'Colegio ficticio',
  grado: '2.º',
}
const instante = '2026-10-17T15:04:05Z'
const nota = {
  id: 'nota-ficticia',
  tipo: 'NOTA_PROFESIONAL',
  titulo: 'Nota ficticia',
  contenido: 'Texto ficticio guardado',
  visibilidad: 'TODOS',
  creadoEn: instante,
  actualizadoEn: instante,
  puedeEditar: true,
}
let aportes
let puedeCrear
function abrir(slug = '', autenticado = true) {
  return render(
    <MemoryRouter
      initialEntries={[`/proyectos/${id}${slug ? `/${slug}` : ''}`]}
    >
      <AuthContext.Provider
        value={{
          usuario: autenticado ? { nombre: 'Tutora' } : null,
          estado: autenticado ? 'autenticado' : 'anonimo',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}
beforeEach(() => {
  aportes = []
  puedeCrear = true
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/aportes')
      ? aportes
      : ruta.endsWith('/miembros')
        ? []
        : { ...proyecto, puedeCargar: puedeCrear, puedeCargarNotas: puedeCrear },
  }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => {
    const creada = { ...nota, ...datos }
    aportes = [creada]
    return { data: creada }
  })
  cliente.put.mockReset().mockImplementation(async (ruta, datos) => {
    const editada = { ...nota, ...datos, actualizadoEn: '2026-10-18T16:05:06Z' }
    aportes = [editada]
    return { data: editada }
  })
})

describe('Datos personales y navegación compartida', () => {
  it('agrega los tres botones juntos y permite recorrer los datos guardados', async () => {
    abrir()
    const nav = await screen.findByRole('navigation', {
      name: 'Espacios del perfil',
    })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Red', 'Datos personales', 'Notas'])
    await userEvent.click(
      within(nav).getByRole('link', { name: 'Datos personales' }),
    )
    const datos = await screen.findByRole('region', {
      name: 'Datos personales',
    })
    for (const valor of [
      'Luz ficticia',
      'Ejemplo',
      'Luli',
      '12/05/2018',
      'Colegio ficticio',
      '2.º',
    ])
      expect(within(datos).getByText(valor)).toBeInTheDocument()
    expect(document.title).toBe('TRAMA · Datos personales')
    expect(
      screen.getByRole('link', { name: 'Datos personales', current: 'page' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('link', { name: 'Red', exact: true }),
    )
    await screen.findByRole('heading', { name: 'Red', level: 2 })
    expect(
      screen.getByRole('link', { name: 'Notas', exact: true }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('link', { name: 'Volver al perfil' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Fortalezas' }),
    ).toBeInTheDocument()
  })
  it('no consulta aportes para mostrar datos personales y señala campos no informados', async () => {
    cliente.get.mockResolvedValue({ data: { ...proyecto, apodo: null } })
    abrir('datos-personales')
    await screen.findByRole('heading', { name: 'Datos personales' })
    expect(screen.getByText('No informado')).toBeInTheDocument()
    expect(cliente.get).toHaveBeenCalledTimes(1)
    expect(cliente.get).toHaveBeenCalledWith(`/proyectos/${id}`, {
      signal: expect.any(AbortSignal),
    })
  })
  it('no expone datos personales cuando falta permiso', async () => {
    cliente.get.mockRejectedValue({ response: { status: 403 } })
    abrir('datos-personales')
    await screen.findByRole('alert')
    expect(screen.queryByText('Colegio ficticio')).not.toBeInTheDocument()
  })
  it.each(['datos-personales', 'notas'])(
    'protege el acceso directo a %s',
    (slug) => {
      abrir(slug, false)
      expect(
        screen.getByRole('heading', { name: 'Hola de nuevo' }),
      ).toBeInTheDocument()
      expect(cliente.get).not.toHaveBeenCalled()
    },
  )
})

describe('Notas con fecha y hora', () => {
  it('permite escribir una nota y muestra el instante devuelto por el servidor', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('link', { name: 'Notas', exact: true }),
    )
    expect(
      await screen.findByText('Todavía no hay notas. ¡Escribí la primera!'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar nota' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
      target: { value: 'Nota ficticia nueva' },
    })
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Texto de la nota (opcional)' }),
      { target: { value: 'Texto ficticio nuevo' } },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Guardar nota' }))
    expect(
      await screen.findByRole('heading', { name: 'Nota ficticia nueva' }),
    ).toBeInTheDocument()
    const articulo = screen.getByRole('article')
    expect(articulo.querySelector('time')).toHaveAttribute('datetime', instante)
    expect(articulo.querySelector('time')).toHaveTextContent(
      /\d{2}\/\d{2}\/\d{4}.*\d{2}:\d{2}:\d{2}/,
    )
    expect(within(articulo).getByText(/Creada:/)).toBeInTheDocument()
    expect(screen.queryByText(/Última edición:/)).not.toBeInTheDocument()
    expect(cliente.post).toHaveBeenCalledExactlyOnceWith(
      `/proyectos/${id}/aportes`,
      {
        tipo: 'NOTA_PROFESIONAL',
        titulo: 'Nota ficticia nueva',
        contenido: 'Texto ficticio nuevo',
        visibilidad: 'TODOS',
        // 4.2: tipo de nota y fecha de hoy por defecto
        datos: JSON.stringify({ tipoNota: 'ORIENTACION', fecha: hoyIso() }),
      },
    )
    expect(document.title).toBe('TRAMA · Notas')
  })
  it('edita una nota propia conservando fecha original y mostrando la última edición', async () => {
    aportes = [nota]
    abrir('notas')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Editar nota: Nota ficticia' }),
    )
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Texto de la nota (opcional)' }),
      { target: { value: 'Texto ficticio editado' } },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Guardar nota' }))
    expect(
      await screen.findByText('Texto ficticio editado'),
    ).toBeInTheDocument()
    const tiempos = screen.getByRole('article').querySelectorAll('time')
    expect(tiempos).toHaveLength(2)
    expect(tiempos[0]).toHaveAttribute('datetime', instante)
    expect(tiempos[1]).toHaveAttribute('datetime', '2026-10-18T16:05:06Z')
    expect(cliente.put).toHaveBeenCalledTimes(1)
  })
  it('mantiene las notas fuera de las seis secciones de la portada', async () => {
    aportes = [nota]
    abrir()
    await screen.findByRole('heading', { name: 'Fortalezas' })
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6)
    expect(
      screen.queryByRole('heading', { name: nota.titulo }),
    ).not.toBeInTheDocument()
  })
  it('no permite editar notas de otro autor', async () => {
    aportes = [{ ...nota, puedeEditar: false }]
    puedeCrear = false
    abrir('notas')
    await screen.findByRole('heading', { name: nota.titulo })
    expect(
      screen.queryByRole('button', { name: /^Editar nota:/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar nota' }),
    ).not.toBeInTheDocument()
  })
  it('conserva el texto y muestra error si falla el guardado de una nota', async () => {
    cliente.post.mockRejectedValue({ response: { status: 500 } })
    abrir('notas')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar nota' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
      target: { value: 'Nota pendiente' },
    })
    fireEvent.submit(screen.getByRole('form'))
    await screen.findByRole('alert')
    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveValue(
      'Nota pendiente',
    )
    expect(screen.queryByText('Nota guardada.')).not.toBeInTheDocument()
  })
})

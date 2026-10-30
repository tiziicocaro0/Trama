import { act, fireEvent, render, screen, within } from '@testing-library/react'
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
  },
}))
// 2.2: el formulario de fortalezas pregunta qué hace bien y pide un ejemplo
const TITULO_FORTALEZA = '¿Qué hace bien o disfruta?'
const EJEMPLO_FORTALEZA = 'Un ejemplo (opcional)'
const id = '304d3b5e-8c8a-4a50-83d3-a84ade17b697'
const proyecto = { id, nombre: 'Niño ficticio', fechaNacimiento: '2018-05-12' }
const aporteOriginal = {
  id: 'aporte-ficticio',
  tipo: 'FORTALEZA',
  titulo: 'Título ficticio original',
  contenido: 'Descripción ficticia',
  datos: '{"contexto":"ESCUELA"}',
  visibilidad: 'TODOS',
  puedeEditar: true,
}
// 2.1 y 2.2: datos que el editor manda por defecto para intereses y fortalezas
const datosPorDefecto = {
  FORTALEZA: { datos: '{"contexto":"OTRO"}' },
  INTERES: { datos: '{"categoria":"OTRO","intensidad":"MEDIA"}' },
}
let lista
let puedeCrear

function abrir(slug = 'fortalezas') {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}/${slug}`]}>
      <AuthContext.Provider
        value={{
          usuario: { nombre: 'Tutora ficticia' },
          estado: 'autenticado',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  lista = []
  puedeCrear = true
  cliente.get.mockReset().mockImplementation(async (ruta) => ({
    data: ruta.endsWith('/aportes')
      ? lista
      : { ...proyecto, puedeCargar: puedeCrear },
  }))
  cliente.post.mockReset().mockImplementation(async (ruta, datos) => {
    const aporte = { ...datos, id: 'nuevo-aporte-ficticio', puedeEditar: true }
    lista = [aporte, ...lista]
    return { data: aporte }
  })
  cliente.put.mockReset().mockImplementation(async (ruta, datos) => {
    const aporte = { ...datos, id: aporteOriginal.id, puedeEditar: true }
    lista = [aporte]
    return { data: aporte }
  })
})

describe('Crear y editar aportes de las seis secciones', () => {
  it.each([
    ['fortalezas', 'FORTALEZA', TITULO_FORTALEZA, EJEMPLO_FORTALEZA],
    ['intereses', 'INTERES', 'Título', 'Descripción (opcional)'],
    ['comunicacion', 'COMUNICACION', 'Título', 'Descripción (opcional)'],
    ['perfil-sensorial', 'SENSORIAL', 'Título', 'Descripción (opcional)'],
    ['estrategias', 'ESTRATEGIA', 'Título', 'Descripción (opcional)'],
    ['rutinas', 'RUTINA', 'Título', 'Descripción (opcional)'],
  ])(
    'agrega un aporte en %s y lo muestra al volver a consultar el servidor',
    async (slug, tipo, etiquetaTitulo, etiquetaContenido) => {
      abrir(slug)
      await userEvent.click(
        await screen.findByRole('button', { name: 'Agregar aporte' }),
      )
      await userEvent.type(
        screen.getByRole('textbox', { name: etiquetaTitulo }),
        'Nuevo título ficticio',
      )
      await userEvent.type(
        screen.getByRole('textbox', { name: etiquetaContenido }),
        'Nueva descripción ficticia',
      )
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: '¿Quién puede verlo?' }),
        'SOLO_TUTORES',
      )
      await userEvent.click(
        screen.getByRole('button', { name: 'Guardar aporte' }),
      )
      expect(cliente.post).toHaveBeenCalledExactlyOnceWith(
        `/proyectos/${id}/aportes`,
        {
          tipo,
          titulo: 'Nuevo título ficticio',
          contenido: 'Nueva descripción ficticia',
          visibilidad: 'SOLO_TUTORES',
          ...datosPorDefecto[tipo],
        },
      )
      expect(
        await screen.findByRole('heading', {
          name: /Nuevo título ficticio/,
        })
      ).toBeInTheDocument()
      expect(screen.getByText('Nueva descripción ficticia')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Aporte guardado')
    },
  )

  it('un interés manda la categoría y la intensidad elegidas', async () => {
    abrir('intereses')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Título' }),
      'Dinosaurios',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Categoría' }),
      'TEMA',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Intensidad' }),
      'ALTA',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar aporte' }),
    )
    expect(cliente.post).toHaveBeenCalledExactlyOnceWith(
      `/proyectos/${id}/aportes`,
      expect.objectContaining({
        tipo: 'INTERES',
        datos: '{"categoria":"TEMA","intensidad":"ALTA"}',
      }),
    )
  })

  it('edita un aporte propio con sus datos actuales y guarda con PUT', async () => {
    lista = [aporteOriginal]
    abrir()
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Editar aporte: Título ficticio original',
      }),
    )
    expect(
      screen.getByRole('textbox', { name: EJEMPLO_FORTALEZA }),
    ).toHaveValue('Descripción ficticia')
    await userEvent.clear(screen.getByRole('textbox', { name: TITULO_FORTALEZA }))
    await userEvent.type(
      screen.getByRole('textbox', { name: TITULO_FORTALEZA }),
      'Título ficticio editado',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar aporte' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Título ficticio editado' }),
    ).toBeInTheDocument()
    expect(cliente.put).toHaveBeenCalledExactlyOnceWith(
      `/proyectos/${id}/aportes/${aporteOriginal.id}`,
      {
        tipo: 'FORTALEZA',
        titulo: 'Título ficticio editado',
        contenido: 'Descripción ficticia',
        visibilidad: 'TODOS',
        datos: '{"contexto":"ESCUELA"}',
      },
    )
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('cada fortaleza muestra quién la cargó y cuándo (2.2)', async () => {
    lista = [
      {
        ...aporteOriginal,
        puedeEditar: false,
        autorNombre: 'María Díaz',
        creadoEn: '2026-10-20T15:00:00Z',
      },
    ]
    abrir()
    await screen.findByRole('heading', { name: aporteOriginal.titulo })
    expect(screen.getByText('Cargado por: María Díaz')).toBeInTheDocument()
    expect(document.querySelector('time[datetime="2026-10-20T15:00:00Z"]')).not.toBeNull()
  })

  it('el formulario de fortalezas pide qué hace bien, dónde y un ejemplo (2.2)', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    expect(screen.getByRole('textbox', { name: TITULO_FORTALEZA })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '¿Dónde lo hace?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: EJEMPLO_FORTALEZA })).toBeInTheDocument()
  })

  it('no permite editar aportes ajenos y respeta el modo de solo lectura', async () => {
    lista = [{ ...aporteOriginal, puedeEditar: false }]
    puedeCrear = false
    abrir()
    await screen.findByRole('heading', { name: aporteOriginal.titulo })
    expect(screen.getByText(/modo de solo lectura/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar aporte' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Editar aporte:/ }),
    ).not.toBeInTheDocument()
  })

  it('un miembro con permiso de crear no puede editar aportes de otro autor', async () => {
    lista = [{ ...aporteOriginal, puedeEditar: false }]
    abrir()
    await screen.findByRole('heading', { name: aporteOriginal.titulo })
    expect(
      screen.getByRole('button', { name: 'Agregar aporte' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Editar aporte:/ }),
    ).not.toBeInTheDocument()
  })

  it('cancelar conserva el aporte original y devuelve el foco al botón', async () => {
    lista = [aporteOriginal]
    abrir()
    const editar = await screen.findByRole('button', {
      name: 'Editar aporte: Título ficticio original',
    })
    await userEvent.click(editar)
    await userEvent.type(
      screen.getByRole('textbox', { name: TITULO_FORTALEZA }),
      ' otro texto',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(editar).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: aporteOriginal.titulo }),
    ).toBeInTheDocument()
    expect(cliente.put).not.toHaveBeenCalled()
  })

  it('rechaza títulos vacíos sin llamar a la API', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    fireEvent.submit(screen.getByRole('form'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Escribí un título',
    )
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it.each([400, 401, 403, 404, 500, undefined])(
    'conserva el formulario si falla el guardado con %s',
    async (status) => {
      cliente.post.mockRejectedValue({
        response: status ? { status } : undefined,
      })
      abrir()
      await userEvent.click(
        await screen.findByRole('button', { name: 'Agregar aporte' }),
      )
      fireEvent.change(screen.getByRole('textbox', { name: TITULO_FORTALEZA }), {
        target: { value: 'Título ficticio' },
      })
      fireEvent.submit(screen.getByRole('form'))
      await screen.findByRole('alert')
      expect(screen.getByRole('textbox', { name: TITULO_FORTALEZA })).toHaveValue(
        'Título ficticio',
      )
      expect(screen.queryByText('Aporte guardado.')).not.toBeInTheDocument()
    },
  )

  it('bloquea dobles envíos mientras espera al servidor', async () => {
    let rechazar
    cliente.post.mockReturnValue(
      new Promise((resolve, reject) => {
        rechazar = reject
      }),
    )
    abrir()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: TITULO_FORTALEZA }), {
      target: { value: 'Título ficticio' },
    })
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(cliente.post).toHaveBeenCalledTimes(1)
    expect(
      within(form).getByRole('button', { name: 'Guardando…' }),
    ).toBeDisabled()
    await act(async () => rechazar(new Error('Sin conexión')))
    await screen.findByRole('alert')
  })

  it('si falla la lectura no muestra aportes mock ni deja editar', async () => {
    cliente.get.mockImplementation(async (ruta) => {
      if (ruta.endsWith('/aportes')) throw new Error('Sin conexión')
      return { data: proyecto }
    })
    abrir()
    await screen.findByRole('alert')
    expect(screen.queryByText('Creatividad')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar aporte' }),
    ).not.toBeInTheDocument()
  })
})

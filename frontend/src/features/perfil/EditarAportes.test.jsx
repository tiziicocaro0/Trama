import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'
import cliente from '../../api/cliente.js'

// Filtros compactos: se abre el menú del ícono y se elige la opción
async function elegirFiltro(etiqueta, opcion) {
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${etiqueta}`) }))
  await userEvent.click(screen.getByRole('menuitemradio', { name: opcion }))
}
import { limpiarAvisos, obtenerAvisos } from '../../components/avisos/avisosFlotantes.js'

// Las acciones de una tarjeta (editar, archivar, historial) están en sus tres puntitos
async function abrirOpciones(titulo) {
  const boton = await screen.findByRole('button', { name: `Más opciones: ${titulo}` })
  if (boton.getAttribute('aria-expanded') !== 'true') await userEvent.click(boton)
}

// Los avisos flotantes viven fuera de AppRoutes: se leen del registro de avisos
const textosDeAvisos = () => obtenerAvisos().map((aviso) => aviso.texto)

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))
// 2.2: el formulario de fortalezas pregunta qué hace bien, dónde y pide un ejemplo (en "datos")
const TITULO_FORTALEZA = '¿Qué hace bien o disfruta?'
const DESCRIPCION_FORTALEZA = 'Descripción'
const EJEMPLO_FORTALEZA = 'Ejemplo (opcional)'
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
          usuario: { id: 'autor-1', nombre: 'Tutora ficticia' },
          estado: 'autenticado',
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  limpiarAvisos()
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
    ['fortalezas', 'FORTALEZA', TITULO_FORTALEZA, DESCRIPCION_FORTALEZA],
    ['intereses', 'INTERES', 'Título', 'Descripción'],
    ['rutinas', 'RUTINA', 'Título del aporte', 'Descripción'],
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
      if (tipo === 'RUTINA') {
        const formulario = screen.getByRole('form', { name: 'Agregar aporte en Rutinas' })
        await userEvent.click(within(formulario).getByRole('button', { name: 'Alimentación' }))
        await userEvent.click(within(formulario).getByRole('checkbox', { name: 'Casa' }))
        await userEvent.click(within(formulario).getByRole('checkbox', { name: /^Tutores/ }))
      } else {
        await userEvent.click(screen.getByRole('button', { name: /^Elegir quién puede ver/ }))
        // Toda la red viene marcada: se desmarca todo y se deja solo a los tutores
        await userEvent.click(screen.getByRole('checkbox', { name: /^Toda la red/ }))
        await userEvent.click(screen.getByRole('checkbox', { name: /^Tutores/ }))
      }
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
          ...(tipo === 'RUTINA' ? { datos: '{"categoria":"ALIMENTACION","contextos":["CASA"]}' } : {}),
          ...datosPorDefecto[tipo],
        },
      )
      expect(
        await screen.findByRole('heading', {
          name: /Nuevo título ficticio/,
        })
      ).toBeInTheDocument()
      expect(screen.getByText('Nueva descripción ficticia')).toBeInTheDocument()
      expect(textosDeAvisos().some((texto) => texto.startsWith('Listo. Tu aporte se guardó en'))).toBe(true)
    },
  )

  it('valida los campos obligatorios de Rutinas antes de llamar a la API', async () => {
    abrir('rutinas')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(screen.getByText('Elegí una actividad o escribí una categoría.')).toBeInTheDocument()
    expect(screen.getByText('Escribí un título para el aporte.')).toBeInTheDocument()
    expect(screen.getByText('Contá brevemente cómo realiza la actividad.')).toBeInTheDocument()
    expect(screen.getByText('Elegí quién puede ver este aporte.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
  })

  it('crea una categoría personalizada desde el chip y la persiste en el aporte', async () => {
    abrir('rutinas')
    await userEvent.click(await screen.findByRole('button', { name: 'Crear categoría de filtro' }))
    const formulario = await screen.findByRole('form', { name: 'Agregar aporte en Rutinas' })
    await userEvent.click(within(formulario).getByRole('button', { name: 'Otra categoría' }))
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Nombre de la nueva categoría' }), 'Preparación para salir')
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Título del aporte' }), 'Prepara su mochila')
    await userEvent.type(within(formulario).getByRole('textbox', { name: 'Descripción' }), 'Revisa sus cosas con una lista visual')
    await userEvent.click(within(formulario).getByRole('checkbox', { name: /^Toda la red/ }))
    await userEvent.click(within(formulario).getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({
      tipo: 'RUTINA',
      datos: '{"categoria":"PERSONALIZADA","categoriaNombre":"Preparación para salir"}',
    }))
    expect(await screen.findByRole('button', { name: /Preparación para salir/ })).toBeInTheDocument()
  })

  it('exige lista, categoría sensorial y descripción, y guarda en la API', async () => {
    abrir('sensorial')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Título' }), 'Busca balancearse')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(screen.getByText('Elegí una lista.')).toBeInTheDocument()
    expect(screen.getByText('Elegí una categoría sensorial.')).toBeInTheDocument()
    expect(screen.getByText('Escribí una descripción.')).toBeInTheDocument()
    expect(cliente.post).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('radio', { name: 'Le ayuda' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Movimiento y equilibrio' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Casa' }))
    await userEvent.click(screen.getByRole('button', { name: /^Elegir quién puede ver/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Toda la red/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Equipo de educación/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Equipo de salud/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción u observación' }), { target: { value: 'Se hamaca para calmarse' } })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({
      tipo: 'SENSORIAL', titulo: 'Busca balancearse', contenido: 'Se hamaca para calmarse', visibilidad: 'PROFESIONALES',
      datos: '{"lista":"AYUDA","categoria":"MOVIMIENTO_EQUILIBRIO","contexto":"CASA"}',
    }))
    expect(lista).toHaveLength(1)
    await waitFor(() => expect(textosDeAvisos()).toContain('Listo. Tu aporte se guardó en Perfil sensorial.'))
    expect(await screen.findByRole('heading', { name: /Busca balancearse/ })).toBeInTheDocument()
  })

  it('filtra aportes sensoriales reales por lista, categoría y autor', async () => {
    lista = [
      { ...aporteOriginal, id: 'a', tipo: 'SENSORIAL', titulo: 'Busca balancearse', datos: '{"lista":"AYUDA","categoria":"MOVIMIENTO_EQUILIBRIO"}', autorId: 'autor-1' },
      { ...aporteOriginal, id: 'b', tipo: 'SENSORIAL', titulo: 'Le molesta el ruido', datos: '{"lista":"CUESTA","categoria":"AUDICION"}', autorId: 'autor-2', puedeEditar: false },
    ]
    abrir('sensorial')
    await screen.findByRole('heading', { name: 'Busca balancearse' })
    expect(screen.getAllByRole('article')).toHaveLength(2)
    await elegirFiltro('Lista', 'Le cuesta')
    expect(screen.queryByRole('heading', { name: 'Busca balancearse' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le molesta el ruido' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar aporte: Le molesta el ruido' })).not.toBeInTheDocument()
    await elegirFiltro('Lista', 'Ambas listas')
    await userEvent.click(screen.getByRole('button', { name: 'Movimiento y equilibrio' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await userEvent.click(screen.getByRole('switch', { name: 'Solo mis aportes' }))
    expect(screen.getByRole('heading', { name: 'Busca balancearse' })).toBeInTheDocument()
  })

  it('vincula un pictograma al aporte sensorial mediante los endpoints de archivos y aportes', async () => {
    cliente.post.mockImplementation(async (ruta, datos) => {
      if (ruta.endsWith('/archivos')) return { data: { id: 'archivo-ficticio', nombreOriginal: 'pictograma.png', tipoMime: 'image/png', tamanoBytes: 1024 } }
      const aporte = { ...datos, id: 'aporte-sensorial', puedeEditar: true }
      lista = [aporte]
      return { data: aporte }
    })
    abrir('sensorial')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Le cuesta' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Tacto' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Título' }), 'Le incomoda el agua en la cara')
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción u observación' }), { target: { value: 'Llora al lavarse' } })
    fireEvent.drop(screen.getByTestId('zona-soltar-archivo'), { dataTransfer: { files: [new File(['imagen'], 'pictograma.png', { type: 'image/png' })] } })
    expect(await screen.findByText('pictograma.png')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(`/proyectos/${id}/aportes`, expect.objectContaining({ archivoIds: ['archivo-ficticio'] }))
  })

  it('un interés manda la categoría y la intensidad elegidas', async () => {
    abrir('intereses')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Título' }),
      'Dinosaurios',
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
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

  it('guarda y muestra el contexto y el ejemplo de una fortaleza, y permite editarlos', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    await userEvent.type(screen.getByRole('textbox', { name: TITULO_FORTALEZA }), 'Arma rompecabezas')
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: '¿Dónde lo hace?' }),
      'CASA',
    )
    await userEvent.type(
      screen.getByRole('textbox', { name: EJEMPLO_FORTALEZA }),
      'Completó un rompecabezas de animales',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${id}/aportes`,
      expect.objectContaining({
        tipo: 'FORTALEZA',
        datos: JSON.stringify({ contexto: 'CASA', ejemplo: 'Completó un rompecabezas de animales' }),
      }),
    )
    expect(await screen.findByRole('img', { name: 'Dónde: Casa' })).toBeInTheDocument()
    expect(screen.getByText('Completó un rompecabezas de animales')).toBeInTheDocument()
    await abrirOpciones('Arma rompecabezas')
    await userEvent.click(screen.getByRole('button', { name: 'Editar aporte: Arma rompecabezas' }))
    const ejemplo = screen.getByRole('textbox', { name: EJEMPLO_FORTALEZA })
    expect(ejemplo).toHaveValue('Completó un rompecabezas de animales')
    await userEvent.clear(ejemplo)
    await userEvent.type(ejemplo, 'Armó otro rompecabezas')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(await screen.findByText('Armó otro rompecabezas')).toBeInTheDocument()
    expect(cliente.put).toHaveBeenCalledWith(
      `/proyectos/${id}/aportes/nuevo-aporte-ficticio`,
      expect.objectContaining({
        datos: JSON.stringify({ contexto: 'CASA', ejemplo: 'Armó otro rompecabezas' }),
      }),
    )
  })

  it('al elegir Otro en dónde lo hace, deja escribir cuál y lo muestra en la tarjeta', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    await userEvent.type(screen.getByRole('textbox', { name: TITULO_FORTALEZA }), 'Nada con confianza')
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
    // Arranca en Otro: el campo para decir cuál ya está a la vista
    await userEvent.type(screen.getByRole('textbox', { name: /^¿Cuál\?/ }), 'Club de natación')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${id}/aportes`,
      expect.objectContaining({
        datos: JSON.stringify({ contexto: 'OTRO', contextoOtro: 'Club de natación' }),
      }),
    )
    expect(await screen.findByRole('img', { name: 'Dónde: Club de natación' })).toBeInTheDocument()
  })

  it('si cambia de Otro a otra opción, no guarda el detalle', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar aporte' }))
    await userEvent.type(screen.getByRole('textbox', { name: TITULO_FORTALEZA }), 'Ordena sus útiles')
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
    await userEvent.type(screen.getByRole('textbox', { name: /^¿Cuál\?/ }), 'Biblioteca')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '¿Dónde lo hace?' }), 'ESCUELA')
    expect(screen.queryByRole('textbox', { name: /^¿Cuál\?/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar aporte' }))
    expect(cliente.post).toHaveBeenCalledWith(
      `/proyectos/${id}/aportes`,
      expect.objectContaining({ datos: JSON.stringify({ contexto: 'ESCUELA' }) }),
    )
  })

  it('edita un aporte propio con sus datos actuales y guarda con PUT', async () => {
    lista = [aporteOriginal]
    abrir()
    await abrirOpciones('Título ficticio original')
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Editar aporte: Título ficticio original',
      }),
    )
    expect(
      screen.getByRole('textbox', { name: DESCRIPCION_FORTALEZA }),
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
    expect(screen.getByText('María Díaz')).toBeInTheDocument()
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
    await abrirOpciones('Título ficticio original')
    const editar = await screen.findByRole('button', {
      name: 'Editar aporte: Título ficticio original',
    })
    await userEvent.click(editar)
    await userEvent.type(
      screen.getByRole('textbox', { name: TITULO_FORTALEZA }),
      ' otro texto',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    // El foco vuelve a los tres puntitos de la tarjeta
    expect(screen.getByRole('button', { name: 'Más opciones: Título ficticio original' })).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: aporteOriginal.titulo }),
    ).toBeInTheDocument()
    expect(cliente.put).not.toHaveBeenCalled()
  })

  it('rechaza título y descripción vacíos sin llamar a la API', async () => {
    abrir()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Agregar aporte' }),
    )
    fireEvent.submit(screen.getByRole('form'))
    expect(await screen.findByText('Escribí un título de hasta 150 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Escribí una descripción.')).toBeInTheDocument()
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
      fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
      fireEvent.submit(screen.getByRole('form'))
      await screen.findByRole('alert')
      expect(screen.getByRole('textbox', { name: TITULO_FORTALEZA })).toHaveValue(
        'Título ficticio',
      )
      expect(textosDeAvisos()).toHaveLength(0)
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
    fireEvent.change(screen.getByRole('textbox', { name: 'Descripción' }), { target: { value: 'Descripción ficticia' } })
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

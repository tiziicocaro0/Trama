import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import AuthContext from '../auth/AuthContext.js'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
  },
}))

const proyectoId = '7b933b41-4a0d-4271-a764-7780ca5c86e4'
const proyectoMock = {
  id: proyectoId,
  nombre: 'Tomás',
  apellido: 'Fernández',
  apodo: 'Tomi',
  fechaNacimiento: '2017-05-12',
  escuela: 'Escuela N.º 12',
  grado: '3.º grado',
  puedeCargar: true,
}

const resumenMock = {
  intereses: [
    {
      id: 'int-1',
      tipo: 'INTERES',
      titulo: 'Trenes',
      contenido: 'Conoce todas las líneas y estaciones.',
      datos: '{"categoria":"TEMA","intensidad":"ALTA"}',
      visibilidad: 'TODOS',
    },
    {
      id: 'int-2',
      tipo: 'INTERES',
      titulo: 'Dinosaurios',
      contenido: 'Armar figuras de dinosaurios.',
      datos: '{"categoria":"JUEGO","intensidad":"ALTA"}',
      visibilidad: 'TODOS',
    },
    {
      id: 'int-3',
      tipo: 'INTERES',
      titulo: 'Música suave',
      contenido: 'Canciones con guitarra.',
      datos: '{"categoria":"ACTIVIDAD","intensidad":"MEDIA"}',
      visibilidad: 'TODOS',
    },
    {
      id: 'int-4',
      tipo: 'INTERES',
      titulo: 'Cuarto interés extra',
      contenido: 'No debería mostrarse en el top 3.',
      datos: '{"categoria":"OTRO","intensidad":"BAJA"}',
      visibilidad: 'TODOS',
    },
  ],
  comunicacion: [
    {
      id: 'com-1',
      tipo: 'COMUNICACION',
      titulo: 'Frases cortas y claras',
      contenido: 'Acompañar con agenda visual antes de cambiar de actividad.',
      visibilidad: 'TODOS',
    },
  ],
  estrategias: [
    {
      id: 'est-1',
      tipo: 'ESTRATEGIA',
      titulo: 'Anticipar transiciones 5 minutos antes',
      contenido: 'Mostrar el reloj visual antes de guardar.',
      visibilidad: 'TODOS',
    },
  ],
  fortalezas: [
    {
      id: 'for-1',
      tipo: 'FORTALEZA',
      titulo: 'Memoria visual excelente',
      contenido: 'Recuerda secuencias con imágenes.',
      datos: '{"contexto":"ESCUELA"}',
      visibilidad: 'TODOS',
    },
  ],
  sensorial: [
    {
      id: 'sen-1',
      tipo: 'SENSORIAL',
      titulo: 'Ruidos fuertes e imprevistos',
      contenido: 'Evitar timbres estridentes sin aviso previo.',
      visibilidad: 'TODOS',
    },
  ],
  desregulacion: [
    {
      id: 'des-1',
      tipo: 'DESREGULACION',
      titulo: 'Ir al rincón tranquilo y ofrecer auriculares',
      contenido: 'Hablar en voz baja y esperar unos minutos sin hacer preguntas.',
      visibilidad: 'TODOS',
    },
  ],
}

function abrir(ruta = `/proyectos/${proyectoId}`, autenticado = true) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider
        value={{
          usuario: autenticado ? { id: 'u-1', nombre: 'Marta' } : null,
          estado: autenticado ? 'autenticado' : 'anonimo',
          cerrarSesion: vi.fn(),
        }}
      >
        <AppRoutes />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  cliente.defaults.baseURL = '/api'
  cliente.get.mockReset().mockImplementation(async (ruta) => {
    if (ruta.endsWith('/resumen')) {
      return { data: resumenMock }
    }
    if (ruta.endsWith('/aportes')) {
      return { data: [] }
    }
    return { data: proyectoMock }
  })
})

describe('Conocelo en 5 minutos (Tarea 2.8)', () => {
  it('permite abrir "Conocelo en 5 minutos" en 1 toque desde la portada y muestra las 5 secciones con hasta 3 intereses', async () => {
    const user = userEvent.setup()
    abrir(`/proyectos/${proyectoId}`)

    const linkConocelo = await screen.findByRole('link', {
      name: 'Conocelo en 5 minutos',
    })
    await user.click(linkConocelo)

    expect(
      await screen.findByRole('heading', { name: 'Tomás', level: 1 }),
    ).toBeInTheDocument()
    expect(document.title).toBe('TRAMA · Conocelo en 5 minutos')
    expect(
      screen.getByRole('img', { name: /Foto de Tomás no disponible/ }),
    ).toBeInTheDocument()

    const seccionIntereses = screen.getByRole('region', {
      name: '3 intereses principales',
    })
    expect(within(seccionIntereses).getByText('Trenes')).toBeInTheDocument()
    expect(within(seccionIntereses).getByText('Dinosaurios')).toBeInTheDocument()
    expect(
      within(seccionIntereses).getByText('Música suave'),
    ).toBeInTheDocument()
    expect(
      within(seccionIntereses).queryByText('Cuarto interés extra'),
    ).not.toBeInTheDocument()

    expect(
      within(
        screen.getByRole('region', { name: 'Cómo hablarle' }),
      ).getByText('Frases cortas y claras'),
    ).toBeInTheDocument()

    const seccionAyuda = screen.getByRole('region', { name: 'Qué lo ayuda' })
    expect(
      within(seccionAyuda).getByText('Anticipar transiciones 5 minutos antes'),
    ).toBeInTheDocument()
    expect(
      within(seccionAyuda).getByText('Memoria visual excelente'),
    ).toBeInTheDocument()

    expect(
      within(screen.getByRole('region', { name: 'Qué evitar' })).getByText(
        'Ruidos fuertes e imprevistos',
      ),
    ).toBeInTheDocument()

    expect(
      within(
        screen.getByRole('region', { name: 'Qué hacer si se desregula' }),
      ).getByText('Ir al rincón tranquilo y ofrecer auriculares'),
    ).toBeInTheDocument()
  })

  it('invoca el diálogo de impresión del navegador al pulsar Imprimir', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    try {
      abrir(`/proyectos/${proyectoId}/conocelo`)

      const botonImprimir = await screen.findByRole('button', {
        name: 'Imprimir',
      })
      await user.click(botonImprimir)

      expect(printSpy).toHaveBeenCalledTimes(1)
    } finally {
      printSpy.mockRestore()
    }
  })

  it('no muestra el resumen si el usuario no tiene permiso (403)', async () => {
    cliente.get.mockRejectedValue({ response: { status: 403 } })

    abrir(`/proyectos/${proyectoId}/conocelo`)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés permiso para ver este proyecto.',
    )
    expect(
      screen.queryByText('Frases cortas y claras'),
    ).not.toBeInTheDocument()
  })
})


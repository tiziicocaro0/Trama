import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import CampanaNotificaciones from './CampanaNotificaciones.jsx'

vi.mock('../../api/notificaciones.js', () => ({
  obtenerNotificaciones: vi.fn(),
  contarNotificacionesNoLeidas: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasLeidas: vi.fn(),
}))

import {
  obtenerNotificaciones,
  contarNotificacionesNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../../api/notificaciones.js'

const notificacion = {
  id: 'notificacion-1',
  texto: 'Tenés un nuevo aporte',
  link: '/proyectos/123',
  leida: false,
}

function RutaActual() {
  const location = useLocation()
  return <div data-testid="ruta-actual">{location.pathname}</div>
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/inicio']}>
      <CampanaNotificaciones />
      <RutaActual />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  contarNotificacionesNoLeidas.mockResolvedValue(2)
  obtenerNotificaciones.mockResolvedValue([notificacion])
  marcarNotificacionLeida.mockResolvedValue(undefined)
  marcarTodasLeidas.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Campana de notificaciones - RF-26', () => {
  it('muestra la cantidad de notificaciones sin leer', async () => {
    montar()

    expect(
      await screen.findByRole('button', {
        name: 'Notificaciones: 2 sin leer',
      }),
    ).toBeTruthy()

    expect(contarNotificacionesNoLeidas).toHaveBeenCalled()
  })

  it('abre el desplegable y muestra las notificaciones', async () => {
    montar()

    fireEvent.click(screen.getByRole('button', {
      name: /Notificaciones:/,
    }))

    expect(
      await screen.findByText('Tenés un nuevo aporte'),
    ).toBeTruthy()

    expect(obtenerNotificaciones).toHaveBeenCalled()
  })

  it('muestra como máximo las últimas 10 notificaciones recibidas', async () => {
    const lista = Array.from({ length: 15 }, (_, indice) => ({
      id: `notificacion-${indice}`,
      texto: `Aviso ${indice}`,
      link: '/inicio',
      leida: false,
    }))

    obtenerNotificaciones.mockResolvedValue(lista)

    montar()

    fireEvent.click(screen.getByRole('button', {
      name: /Notificaciones:/,
    }))

    expect(await screen.findByText('Aviso 0')).toBeTruthy()

    await waitFor(() => {
      expect(
        screen.getAllByRole('listitem'),
      ).toHaveLength(10)
    })

    expect(screen.queryByText('Aviso 10')).toBeNull()
  })

  it('marca una notificación como leída y navega a su enlace', async () => {
    contarNotificacionesNoLeidas
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)

    montar()

    fireEvent.click(screen.getByRole('button', {
      name: /Notificaciones:/,
    }))

    const aviso = await screen.findByText('Tenés un nuevo aporte')

    fireEvent.click(aviso)

    await waitFor(() => {
      expect(marcarNotificacionLeida)
        .toHaveBeenCalledWith('notificacion-1')

      expect(screen.getByTestId('ruta-actual').textContent)
        .toBe('/proyectos/123')
    })
  })

  it('permite marcar todas las notificaciones como leídas', async () => {
    montar()

    fireEvent.click(screen.getByRole('button', {
      name: /Notificaciones:/,
    }))

    await screen.findByText('Tenés un nuevo aporte')

    fireEvent.click(screen.getByRole('button', {
      name: 'Marcar todas como leídas',
    }))

    await waitFor(() => {
      expect(marcarTodasLeidas).toHaveBeenCalledOnce()
      expect(
        screen.getByRole('button', {
          name: 'Notificaciones: 0 sin leer',
        }),
      ).toBeTruthy()
    })
  })

  it('no navega a enlaces externos o inválidos', async () => {
    obtenerNotificaciones.mockResolvedValue([{
      ...notificacion,
      link: '//sitio-externo.com',
    }])

    montar()

    fireEvent.click(screen.getByRole('button', {
      name: /Notificaciones:/,
    }))

    fireEvent.click(await screen.findByText('Tenés un nuevo aporte'))

    expect(
      await screen.findByText('El enlace de esta notificación no es válido.'),
    ).toBeTruthy()

    expect(screen.getByTestId('ruta-actual').textContent)
      .toBe('/inicio')
  })

  it('actualiza el contador cada 60 segundos', async () => {
    vi.useFakeTimers()

    contarNotificacionesNoLeidas.mockResolvedValue(3)

    montar()

    await act(async () => {
      await Promise.resolve()
    })

    expect(contarNotificacionesNoLeidas).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(contarNotificacionesNoLeidas).toHaveBeenCalledTimes(2)

    expect(
      screen.getByRole('button', {
        name: 'Notificaciones: 3 sin leer',
      }),
    ).toBeTruthy()
  })
})
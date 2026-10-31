import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TarjetaAporte from './TarjetaAporte.jsx'

const aporteBase = {
  id: '1',
  tipo: 'INTERES',
  titulo: 'Le gusta dibujar',
  contenido: 'Disfruta dibujar animales',
  visibilidad: 'TODOS',
  creadoEn: '2026-10-20T14:30:00Z',
  puedeEditar: true,
}

describe('TarjetaAporte - RF-06 y Tarea 3.0', () => {
  it.each(['CASA', 'ESCUELA', 'CONSULTORIO', 'OTRO'])(
    'muestra el contexto %s de una fortaleza sin ejemplo',
    (contexto) => {
      render(<TarjetaAporte aporte={{ ...aporteBase, tipo: 'FORTALEZA', datos: JSON.stringify({ contexto }) }} />)
      expect(screen.getByText(`Contexto: ${contexto[0]}${contexto.slice(1).toLowerCase()}`)).toBeInTheDocument()
      expect(screen.queryByText(/^Ejemplo:/)).not.toBeInTheDocument()
    },
  )

  it.each([undefined, 'texto inválido', 'null', '{}'])(
    'conserva la tarjeta si faltan datos de fortaleza o son inválidos: %s',
    (datos) => {
      render(<TarjetaAporte aporte={{ ...aporteBase, tipo: 'FORTALEZA', datos }} />)
      expect(screen.getByRole('heading', { name: aporteBase.titulo })).toBeInTheDocument()
      expect(screen.queryByText(/^Contexto:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Ejemplo:/)).not.toBeInTheDocument()
    },
  )

  it('no muestra candado cuando es público', () => {
    render(<TarjetaAporte aporte={aporteBase} />)

    expect(
      screen.queryByRole('img', {
        name: 'Visibilidad restringida',
      }),
    ).not.toBeInTheDocument()
  })

  it.each([
    'SOLO_TUTORES',
    'SOLO_SALUD',
    'SOLO_EDUCACION',
  ])('muestra candado para %s', (visibilidad) => {
    render(<TarjetaAporte aporte={{ ...aporteBase, visibilidad }} />)

    expect(
      screen.getByRole('img', {
        name: 'Visibilidad restringida',
      }),
    ).toBeInTheDocument()
  })

  it('no muestra candado si falta visibilidad', () => {
    const aporteSinVisibilidad = { ...aporteBase }
    delete aporteSinVisibilidad.visibilidad

    render(<TarjetaAporte aporte={aporteSinVisibilidad} />)

    expect(
      screen.queryByRole('img', {
        name: 'Visibilidad restringida',
      }),
    ).not.toBeInTheDocument()
  })

  it('muestra autor, fecha, contenido y botones Editar y Archivar cuando el usuario es el autor', async () => {
    const alEditar = vi.fn()
    const alArchivar = vi.fn()

    render(
      <TarjetaAporte
        aporte={aporteBase}
        autor="Marta Fernández"
        alEditar={alEditar}
        alArchivar={alArchivar}
      />,
    )

    expect(screen.getByText('Disfruta dibujar animales')).toBeInTheDocument()
    expect(
      screen.getByText('Cargado por: Marta Fernández'),
    ).toBeInTheDocument()
    expect(document.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-20T14:30:00Z',
    )

    const botonEditar = screen.getByRole('button', {
      name: 'Editar aporte: Le gusta dibujar',
    })
    const botonArchivar = screen.getByRole('button', {
      name: 'Archivar aporte: Le gusta dibujar',
    })

    expect(botonEditar).toBeInTheDocument()
    expect(botonArchivar).toBeInTheDocument()

    await userEvent.click(botonEditar)
    expect(alEditar).toHaveBeenCalledTimes(1)

    await userEvent.click(botonArchivar)
    expect(alArchivar).toHaveBeenCalledTimes(1)
  })

  it('oculta los botones Editar y Archivar cuando el usuario no es el autor (puedeEditar = false)', () => {
    render(
      <TarjetaAporte
        aporte={{ ...aporteBase, puedeEditar: false }}
        autor="Marta Fernández"
        alEditar={vi.fn()}
        alArchivar={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('button', {
        name: 'Editar aporte: Le gusta dibujar',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'Archivar aporte: Le gusta dibujar',
      }),
    ).not.toBeInTheDocument()
  })

  // 3.2: Historial de versiones
  it('muestra Ver historial a cualquier miembro y avisa al hacer clic', async () => {
    const alVerHistorial = vi.fn()
    const user = userEvent.setup()

    render(
      <TarjetaAporte
        aporte={{ ...aporteBase, puedeEditar: false }}
        alVerHistorial={alVerHistorial}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Ver historial del aporte: Le gusta dibujar',
      }),
    )

    expect(alVerHistorial).toHaveBeenCalledTimes(1)
  })

  it('no muestra Ver historial si no se pasa alVerHistorial', () => {
    render(<TarjetaAporte aporte={aporteBase} alEditar={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: /Ver historial/ }),
    ).not.toBeInTheDocument()
  })

  it('con historial disponible, quien no es autor sigue sin ver Editar ni Archivar', () => {
    render(
      <TarjetaAporte
        aporte={{ ...aporteBase, puedeEditar: false }}
        alEditar={vi.fn()}
        alArchivar={vi.fn()}
        alVerHistorial={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Editar aporte: Le gusta dibujar' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Archivar aporte: Le gusta dibujar' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Ver historial del aporte: Le gusta dibujar',
      }),
    ).toBeInTheDocument()
  })
})

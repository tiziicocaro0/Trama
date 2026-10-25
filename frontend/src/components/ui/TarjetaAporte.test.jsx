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
})

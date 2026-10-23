import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TarjetaAporte from './TarjetaAporte.jsx'

const aporteBase = {
  id: '1',
  tipo: 'INTERES',
  titulo: 'Le gusta dibujar',
  contenido: 'Disfruta dibujar animales',
  visibilidad: 'TODOS',
  puedeEditar: true,
}

describe('TarjetaAporte - RF-06', () => {
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
    render(
      <TarjetaAporte
        aporte={{ ...aporteBase, visibilidad }}
      />,
    )

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

  it('mantiene disponible la edición', () => {
    const alEditar = vi.fn()

    render(
      <TarjetaAporte
        aporte={aporteBase}
        alEditar={alEditar}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'Editar aporte: Le gusta dibujar',
      }),
    ).toBeInTheDocument()
  })
})
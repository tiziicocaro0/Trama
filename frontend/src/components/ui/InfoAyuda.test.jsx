import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import InfoAyuda from './InfoAyuda.jsx'

describe('Ícono (i) con una aclaración', () => {
  it('se abre al pasar el mouse o con el teclado y se cierra con Escape o al tocar afuera', async () => {
    const user = userEvent.setup()
    render(
      <>
        <InfoAyuda etiqueta="Sobre la matrícula">TRAMA no la verifica.</InfoAyuda>
        <button type="button">Afuera</button>
      </>,
    )
    const boton = screen.getByRole('button', { name: 'Sobre la matrícula' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(boton)
    expect(screen.getByRole('tooltip')).toHaveTextContent('TRAMA no la verifica.')
    await user.unhover(boton)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.tab()
    expect(boton).toHaveAccessibleDescription('TRAMA no la verifica.')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.click(boton)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Afuera' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

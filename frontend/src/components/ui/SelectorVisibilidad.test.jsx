import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import SelectorVisibilidad from './SelectorVisibilidad.jsx'

function Prueba({ inicial = '' }) {
  const [valor, setValor] = useState(inicial)
  return (
    <>
      <SelectorVisibilidad id="prueba" value={valor} onChange={(evento) => setValor(evento.target.value)} />
      <output aria-label="Valor">{valor}</output>
    </>
  )
}

const casilla = (nombre) => screen.getByRole('checkbox', { name: new RegExp(`^${nombre}`) })
const valor = () => screen.getByRole('status', { name: 'Valor' }).textContent

describe('Quién puede ver (casillas)', () => {
  it('Toda la red marca todo, y al tocarla de nuevo desmarca todo', async () => {
    render(<Prueba />)
    await userEvent.click(casilla('Toda la red'))
    expect(valor()).toBe('TODOS')
    for (const nombre of ['Tutores', 'Equipo de educación', 'Equipo de salud']) expect(casilla(nombre)).toBeChecked()
    await userEvent.click(casilla('Toda la red'))
    expect(valor()).toBe('')
    expect(casilla('Equipo de salud')).not.toBeChecked()
  })

  it('combina equipos en el valor que guarda el back y queda abierto', async () => {
    render(<Prueba />)
    await userEvent.click(casilla('Equipo de educación'))
    expect(valor()).toBe('SOLO_EDUCACION')
    await userEvent.click(casilla('Equipo de salud'))
    expect(valor()).toBe('PROFESIONALES')
    // Los tutores siempre ven: con un equipo marcado su casilla no se puede sacar
    expect(casilla('Tutores')).toBeChecked()
    expect(casilla('Tutores')).toBeDisabled()
    await userEvent.click(casilla('Equipo de educación'))
    expect(valor()).toBe('SOLO_SALUD')
    await userEvent.click(casilla('Equipo de salud'))
    expect(valor()).toBe('SOLO_TUTORES')
    expect(casilla('Toda la red')).toBeVisible()
  })

  it('con algo elegido arranca cerrado y muestra el resumen', async () => {
    render(<Prueba inicial="SOLO_SALUD" />)
    const resumen = screen.getByRole('button', { name: 'Elegir quién puede ver. Ahora: Tutores y equipo de salud' })
    expect(resumen).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await userEvent.click(resumen)
    expect(casilla('Equipo de salud')).toBeChecked()
  })
})

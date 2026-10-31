import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import CampoFecha from './CampoFecha.jsx'

function Probar({ alCambiar, inicial = '' }) {
  const [valor, setValor] = useState(inicial)
  return (
    <>
      <label htmlFor="fecha">Fecha de nacimiento</label>
      <CampoFecha
        id="fecha"
        name="fecha"
        value={valor}
        onChange={(e) => {
          alCambiar(e.target.value)
          setValor(e.target.value)
        }}
      />
    </>
  )
}

describe('CampoFecha', () => {
  it('se puede escribir la fecha y arma dd/mm/aaaa sola', async () => {
    const alCambiar = vi.fn()
    render(<Probar alCambiar={alCambiar} />)
    const campo = screen.getByLabelText('Fecha de nacimiento')
    await userEvent.type(campo, '1205')
    expect(campo).toHaveValue('12/05')
    expect(alCambiar).toHaveBeenLastCalledWith('')
    await userEvent.type(campo, '2018')
    expect(campo).toHaveValue('12/05/2018')
    expect(alCambiar).toHaveBeenLastCalledWith('2018-05-12')
  })

  it('acepta una fecha pegada en formato ISO y la muestra en criollo', () => {
    const alCambiar = vi.fn()
    render(<Probar alCambiar={alCambiar} />)
    const campo = screen.getByLabelText('Fecha de nacimiento')
    fireEvent.change(campo, { target: { value: '2017-03-09' } })
    expect(campo).toHaveValue('09/03/2017')
    expect(alCambiar).toHaveBeenLastCalledWith('2017-03-09')
  })

  it('sigue ofreciendo el calendario y lo que se elige ahí aparece escrito', async () => {
    const alCambiar = vi.fn()
    render(<Probar alCambiar={alCambiar} inicial="2018-05-12" />)
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('12/05/2018')
    await userEvent.click(screen.getByRole('button', { name: 'Elegir la fecha en el calendario' }))
    await userEvent.click(screen.getByRole('button', { name: /^20/ }))
    expect(alCambiar).toHaveBeenLastCalledWith('2018-05-20')
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('20/05/2018')
  })
})

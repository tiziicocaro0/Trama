import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DescargarMisAportes from './DescargarMisAportes.jsx'
import { descargarMisAportes } from '../../../api/exportacion.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'

vi.mock('../../../api/exportacion.js', () => ({ descargarMisAportes: vi.fn() }))
vi.mock('../../../components/avisos/avisosFlotantes.js', () => ({ avisar: vi.fn(), avisarError: vi.fn() }))

const proyecto = { id: 'p1', nombre: 'Niño ficticio' }

beforeEach(() => {
  descargarMisAportes.mockReset().mockResolvedValue()
  avisar.mockReset()
  avisarError.mockReset()
})

describe('8.4: descargar mis aportes', () => {
  it('abre la ventana, explica qué incluye y descarga el PDF', async () => {
    const user = userEvent.setup()
    render(<DescargarMisAportes proyecto={proyecto} />)

    await user.click(screen.getByRole('button', { name: 'Descargar mis aportes' }))
    const ventana = screen.getByRole('dialog')
    expect(within(ventana).getByText(/No incluye lo que cargaron otras personas/)).toBeInTheDocument()
    expect(within(ventana).getByText(/descargalo antes/)).toBeInTheDocument()

    await user.click(within(ventana).getByRole('button', { name: 'Descargar PDF' }))
    expect(descargarMisAportes).toHaveBeenCalledWith('p1', 'pdf')
    expect(avisar).toHaveBeenCalledWith('Descargamos tus aportes.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('también descarga el JSON', async () => {
    const user = userEvent.setup()
    render(<DescargarMisAportes proyecto={proyecto} />)

    await user.click(screen.getByRole('button', { name: 'Descargar mis aportes' }))
    await user.click(screen.getByRole('button', { name: 'Descargar JSON' }))

    expect(descargarMisAportes).toHaveBeenCalledWith('p1', 'json')
  })

  it('si falla, avisa con un error y deja la ventana abierta', async () => {
    const user = userEvent.setup()
    descargarMisAportes.mockRejectedValue(new Error('sin conexión'))
    render(<DescargarMisAportes proyecto={proyecto} />)

    await user.click(screen.getByRole('button', { name: 'Descargar mis aportes' }))
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(avisarError).toHaveBeenCalledWith('No pudimos preparar la descarga. Intentá nuevamente.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

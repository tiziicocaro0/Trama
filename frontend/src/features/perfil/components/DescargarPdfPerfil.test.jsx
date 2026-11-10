import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DescargarPdfPerfil from './DescargarPdfPerfil.jsx'
import { descargarPdfPerfil } from '../../../api/exportacion.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'

vi.mock('../../../api/exportacion.js', () => ({ descargarPdfPerfil: vi.fn() }))
vi.mock('../../../components/avisos/avisosFlotantes.js', () => ({ avisar: vi.fn(), avisarError: vi.fn() }))

beforeEach(() => {
  descargarPdfPerfil.mockReset().mockResolvedValue()
  avisar.mockReset()
  avisarError.mockReset()
})

describe('8.3: descargar el PDF del perfil o de Conocelo', () => {
  it('descarga la sección pedida y avisa', async () => {
    const user = userEvent.setup()
    render(<DescargarPdfPerfil proyectoId="p1" seccion="conocelo" />)

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(descargarPdfPerfil).toHaveBeenCalledWith('p1', 'conocelo')
    expect(avisar).toHaveBeenCalledWith('Descargamos el PDF.')
  })

  it('si falla, avisa con un error', async () => {
    const user = userEvent.setup()
    descargarPdfPerfil.mockRejectedValue(new Error('sin conexión'))
    render(<DescargarPdfPerfil proyectoId="p1" seccion="perfil" />)

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(avisarError).toHaveBeenCalledWith('No pudimos preparar el PDF. Intentá nuevamente.')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FiltrosExportacion from './FiltrosExportacion.jsx'
import { listarMiembros } from '../../../api/miembros.js'

vi.mock('../../../api/miembros.js', () => ({ listarMiembros: vi.fn() }))

// Datos ficticios
const MIEMBROS = [
  { id: 'm1', usuarioId: 'u-tutora', nombre: 'María', apellido: 'Pérez', rol: 'TUTOR' },
  { id: 'm2', usuarioId: 'u-abuelo', nombre: 'Jorge', apellido: 'Gómez', rol: 'FAMILIAR' },
  { id: 'm3', usuarioId: 'u-docente', nombre: 'Laura', apellido: 'Díaz', rol: 'EDUCACION' },
  { id: 'm4', usuarioId: 'u-psico', nombre: 'Ana', apellido: 'Ruiz', rol: 'SALUD' },
]

function abrir() {
  const onDescargar = vi.fn()
  render(
    <FiltrosExportacion abierto proyectoId="p1" descargando={false} onCerrar={() => {}} onDescargar={onDescargar} />,
  )
  return onDescargar
}

beforeEach(() => {
  listarMiembros.mockReset().mockResolvedValue(MIEMBROS)
})

describe('8.1: filtros del PDF', () => {
  it('sin marcar "Elegir" descarga todo', async () => {
    const user = userEvent.setup()
    const onDescargar = abrir()

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(onDescargar).toHaveBeenCalledWith({})
  })

  it('agrupa a las personas por tipo de aportador, todas marcadas', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByLabelText('Elegir qué aportes incluir'))

    expect(await screen.findByLabelText('Familia')).toBeChecked()
    expect(screen.getByLabelText('Docentes')).toBeChecked()
    expect(screen.getByLabelText('Profesionales')).toBeChecked()
    expect(screen.getByLabelText('Jorge Gómez')).toBeChecked()
  })

  it('desmarcar un tipo desmarca a sus personas y se envían las que quedan', async () => {
    const user = userEvent.setup()
    const onDescargar = abrir()
    await user.click(screen.getByLabelText('Elegir qué aportes incluir'))
    await user.click(await screen.findByLabelText('Familia'))

    expect(screen.getByLabelText('María Pérez')).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(onDescargar).toHaveBeenCalledWith({ usuarios: ['u-docente', 'u-psico'] })
  })

  it('con todos marcados solo se envían las fechas', async () => {
    const user = userEvent.setup()
    const onDescargar = abrir()
    await user.click(screen.getByLabelText('Elegir qué aportes incluir'))
    await screen.findByLabelText('Familia')
    await user.type(screen.getByLabelText('Desde (opcional)'), '01/09/2026')
    await user.type(screen.getByLabelText('Hasta (opcional)'), '06/11/2026')
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))

    expect(onDescargar).toHaveBeenCalledWith({ desde: '2026-09-01', hasta: '2026-11-06' })
  })

  it('un rango invertido muestra el error y no deja descargar', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByLabelText('Elegir qué aportes incluir'))
    await screen.findByLabelText('Familia')
    await user.type(screen.getByLabelText('Desde (opcional)'), '06/11/2026')
    await user.type(screen.getByLabelText('Hasta (opcional)'), '01/09/2026')

    expect(screen.getByText('Tiene que ser posterior a "Desde"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeDisabled()
  })

  it('sin nadie elegido no deja descargar', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByLabelText('Elegir qué aportes incluir'))
    for (const tipo of ['Familia', 'Docentes', 'Profesionales']) {
      await user.click(await screen.findByLabelText(tipo))
    }

    expect(screen.getByRole('alert')).toHaveTextContent('Elegí al menos una persona.')
    expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeDisabled()
  })
})

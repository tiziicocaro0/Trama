import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RevisionAporte from './RevisionAporte.jsx'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import { marcarRevision, obtenerRevision, solicitarRevision } from '../../../api/revisiones.js'
vi.mock('../../../api/revisiones.js', () => ({ marcarRevision: vi.fn(), obtenerRevision: vi.fn(), solicitarRevision: vi.fn() }))
const aporte = { id: 'a1', proyectoId: 'p1', autorId: 'autor', revisionPendiente: false }
const mostrar = (props = {}) => render(<RevisionAporte aporte={aporte} usuarioId="tutor" esTutor {...props} />)
beforeEach(() => vi.resetAllMocks())
describe('Revisión de aportes', () => {
  it('integra la accion en la tarjeta compartida', () => {
    render(<TarjetaAporte aporte={{ ...aporte, tipo: 'INTERES', titulo: 'Un aporte' }} usuarioId="tutor" esTutor />)
    expect(screen.getByRole('button', { name: /Pedir revisi/ })).toBeInTheDocument()
  })
  it('solo ofrece solicitar al tutor en aportes ajenos sin pendiente', () => {
    const { rerender } = mostrar()
    expect(screen.getByText('Pedir revisión')).toBeInTheDocument()
    rerender(<RevisionAporte aporte={aporte} usuarioId="autor" esTutor />)
    expect(screen.queryByText('Pedir revisión')).not.toBeInTheDocument()
    rerender(<RevisionAporte aporte={aporte} usuarioId="otro" />)
    expect(screen.queryByText('Pedir revisión')).not.toBeInTheDocument()
    rerender(<RevisionAporte aporte={{ ...aporte, revisionPendiente: true }} usuarioId="tutor" esTutor />)
    expect(screen.queryByText('Pedir revisión')).not.toBeInTheDocument()
    expect(screen.getByText('Revisión pendiente')).toBeInTheDocument()
  })
  it('abre y cierra el modal y exige motivo', () => {
    mostrar()
    fireEvent.click(screen.getByText('Pedir revisión'))
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: '  ' } })
    fireEvent.click(screen.getByText('Enviar solicitud'))
    expect(screen.getByText('Ingresá el motivo de la revisión.')).toBeInTheDocument()
    expect(solicitarRevision).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('impide duplicados, conserva el texto ante error y actualiza al guardar', async () => {
    let rechazar
    solicitarRevision.mockReturnValueOnce(new Promise((_, reject) => { rechazar = reject }))
    const actualizar = vi.fn()
    mostrar({ alActualizar: actualizar })
    fireEvent.click(screen.getByText('Pedir revisión'))
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: ' Motivo ' } })
    fireEvent.click(screen.getByText('Enviar solicitud'))
    expect(solicitarRevision).toHaveBeenCalledWith('p1', 'a1', 'Motivo')
    expect(screen.getByText('Enviando…')).toBeDisabled()
    fireEvent.submit(screen.getByText('Enviando…').closest('form'))
    expect(solicitarRevision).toHaveBeenCalledTimes(1)
    rechazar(new Error('Error de conexión'))
    expect(await screen.findByText('Error de conexión')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toHaveValue(' Motivo ')
    solicitarRevision.mockResolvedValueOnce({ id: 'r1', estado: 'PENDIENTE' })
    fireEvent.click(screen.getByText('Enviar solicitud'))
    await waitFor(() => expect(actualizar).toHaveBeenCalledOnce())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('muestra el motivo al autor y resuelve con el ID real', async () => {
    obtenerRevision.mockResolvedValue({ id: 'r1', estado: 'PENDIENTE', motivo: 'Fecha incorrecta' })
    let completar
    marcarRevision.mockReturnValue(new Promise((resolve) => { completar = resolve }))
    const actualizar = vi.fn()
    const pendiente = { ...aporte, revisionPendiente: true, revisionPendienteId: 'r1' }
    const { rerender } = mostrar({ aporte: pendiente, usuarioId: 'autor', alActualizar: actualizar })
    expect(await screen.findByText('Motivo: Fecha incorrecta')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Marcar como revisado'))
    expect(marcarRevision).toHaveBeenCalledWith('p1', 'r1')
    expect(screen.getByText('Guardando…')).toBeDisabled()
    completar({ id: 'r1', estado: 'REVISADA' })
    await waitFor(() => expect(actualizar).toHaveBeenCalledOnce())
    rerender(<RevisionAporte aporte={aporte} usuarioId="autor" />)
    expect(screen.queryByText('Revisión pendiente')).not.toBeInTheDocument()
    rerender(<RevisionAporte aporte={pendiente} usuarioId="otro" />)
    expect(screen.queryByText('Marcar como revisado')).not.toBeInTheDocument()
  })
  it('mantiene la etiqueta ante errores al marcar', async () => {
    obtenerRevision.mockResolvedValue({ id: 'r1', estado: 'PENDIENTE', motivo: 'Motivo' })
    marcarRevision.mockRejectedValue(new Error('Sin permiso'))
    mostrar({ aporte: { ...aporte, revisionPendiente: true, revisionPendienteId: 'r1' }, usuarioId: 'autor' })
    fireEvent.click(screen.getByText('Marcar como revisado'))
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument()
    expect(screen.getByText('Revisión pendiente')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EspecialidadModal from './EspecialidadModal.jsx'

function abrir(props = {}) {
  const defaults = {
    abierto: true,
    onCerrar: vi.fn(),
    onGuardar: vi.fn(),
    rol: 'SALUD',
    especialidadesActuales: [],
    ...props,
  }
  return { ...defaults, ...render(<EspecialidadModal {...defaults} />) }
}

describe('EspecialidadModal', () => {
  it('muestra especialidades de salud cuando el rol es SALUD', () => {
    abrir({ rol: 'SALUD' })
    expect(screen.getByLabelText('Psicología')).toBeInTheDocument()
    expect(screen.getByLabelText('Fonoaudiología')).toBeInTheDocument()
    expect(screen.queryByLabelText('Docente primario')).not.toBeInTheDocument()
  })

  it('muestra especialidades de educación cuando el rol es EDUCACION', () => {
    abrir({ rol: 'EDUCACION' })
    expect(screen.getByLabelText('Docente primario')).toBeInTheDocument()
    expect(screen.getByLabelText('Inspector/a')).toBeInTheDocument()
    expect(screen.queryByLabelText('Psicología')).not.toBeInTheDocument()
  })

  it('preselecciona las especialidades actuales', () => {
    abrir({
      rol: 'SALUD',
      especialidadesActuales: [
        { especialidad: 'PSICOLOGIA', aclaracion: 'Lic. Clínica' },
      ],
    })
    expect(screen.getByLabelText('Psicología')).toBeChecked()
  })

  it('permite seleccionar y deseleccionar una especialidad', async () => {
    const user = userEvent.setup()
    abrir({ rol: 'SALUD' })

    const checkbox = screen.getByLabelText('Psicología')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('muestra campo de aclaración al seleccionar una especialidad', async () => {
    const user = userEvent.setup()
    abrir({ rol: 'SALUD' })

    expect(screen.queryByLabelText(/Aclaración/)).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Psicología'))
    expect(screen.getByLabelText(/Aclaración/)).toBeInTheDocument()
  })

  it('valida que se seleccione al menos una especialidad', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn()
    abrir({ rol: 'SALUD', onGuardar })

    // El botón Guardar está deshabilitado sin selección
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('valida aclaración obligatoria para "Otra"', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn()
    abrir({ rol: 'SALUD', onGuardar })

    await user.click(screen.getByLabelText('Otra (salud)'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      screen.getByText(/Indicá tu especialidad en el campo de aclaración/),
    ).toBeInTheDocument()
    expect(onGuardar).not.toHaveBeenCalled()
  })

  it('llama onGuardar con la lista correcta', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn().mockResolvedValue(undefined)
    abrir({ rol: 'SALUD', onGuardar })

    await user.click(screen.getByLabelText('Psicología'))
    const input = screen.getByLabelText(/Aclaración/)
    await user.type(input, 'Lic. en Psicología Clínica')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onGuardar).toHaveBeenCalledWith([
      { especialidad: 'PSICOLOGIA', aclaracion: 'Lic. en Psicología Clínica' },
    ])
  })

  it('muestra error del servidor al fallar el guardado', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn().mockRejectedValue({
      response: { data: { mensaje: 'Especialidad inválida para tu rol' } },
    })
    abrir({ rol: 'SALUD', onGuardar })

    await user.click(screen.getByLabelText('Psicología'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText('Especialidad inválida para tu rol'),
    ).toBeInTheDocument()
  })

  it('llama onCerrar al cancelar', async () => {
    const user = userEvent.setup()
    const onCerrar = vi.fn()
    abrir({ rol: 'SALUD', onCerrar })

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCerrar).toHaveBeenCalled()
  })

  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(
      <EspecialidadModal
        abierto={false}
        onCerrar={vi.fn()}
        onGuardar={vi.fn()}
        rol="SALUD"
        especialidadesActuales={[]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('permite múltiples selecciones', async () => {
    const user = userEvent.setup()
    const onGuardar = vi.fn().mockResolvedValue(undefined)
    abrir({ rol: 'SALUD', onGuardar })

    await user.click(screen.getByLabelText('Psicología'))
    await user.click(screen.getByLabelText('Fonoaudiología'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onGuardar).toHaveBeenCalledWith(
      expect.arrayContaining([
        { especialidad: 'PSICOLOGIA', aclaracion: null },
        { especialidad: 'FONOAUDIOLOGIA', aclaracion: null },
      ]),
    )
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import CabeceraPerfil from '../perfil/components/CabeceraPerfil.jsx'

const proyecto = {
  id: '5c1a7a7e-0f7b-4f43-9a57-2a3b8f6f9f10',
  nombre: 'Niño de ejemplo',
  fechaNacimiento: '2017-05-12',
}

function abrir(datos) {
  return render(
    <MemoryRouter>
      <CabeceraPerfil proyecto={datos} />
    </MemoryRouter>,
  )
}

describe('9.0: aviso del plan gratuito', () => {
  it('lo ve el profesional que está en solo lectura por el plan', () => {
    abrir({ ...proyecto, puedeCargar: false, soloLecturaPorPlan: true })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Con el plan gratuito podés editar en 2 niños. Suscribite para editar en todos.',
    )
  })

  it('no aparece si el proyecto no tiene el límite', () => {
    abrir({ ...proyecto, puedeCargar: true, soloLecturaPorPlan: false })
    expect(screen.queryByText(/plan gratuito/)).not.toBeInTheDocument()
  })

  it('no aparece para quien es solo lectura por otro motivo (por ejemplo, un familiar)', () => {
    abrir({ ...proyecto, puedeCargar: false, soloLecturaPorPlan: false })
    expect(screen.queryByText(/plan gratuito/)).not.toBeInTheDocument()
  })
})

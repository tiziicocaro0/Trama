import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthContext from '../auth/AuthContext.js'
import NotificacionesGlobales from './NotificacionesGlobales.jsx'

vi.mock('./CampanaNotificaciones.jsx', () => ({
  default: () => <button type="button">Campana</button>,
}))

const sesion = { usuario: { nombre: 'Tutora' }, estado: 'autenticado' }

function montar(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={sesion}>
        <NotificacionesGlobales />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('Campana en las pantallas privadas', () => {
  it('aparece en el calendario del niño', () => {
    montar('/proyectos/abc/calendario')
    expect(screen.getByRole('button', { name: 'Campana' })).toBeInTheDocument()
  })

  it('no aparece en "Mostrarle el día", que es a pantalla completa (5.3)', () => {
    montar('/proyectos/abc/hoy')
    expect(screen.queryByRole('button', { name: 'Campana' })).not.toBeInTheDocument()
  })
})

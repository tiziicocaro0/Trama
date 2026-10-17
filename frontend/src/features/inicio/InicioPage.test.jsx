import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AuthContext from '../auth/AuthContext.js'
import InicioPage from './InicioPage.jsx'

const usuario = {
  nombre: 'Nora',
  apellido: 'Ejemplo',
  email: 'nora@trama.test',
}

function abrir(ruta = '/inicio') {
  const cerrarSesion = vi.fn()
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario, cerrarSesion }}>
        <InicioPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return { cerrarSesion }
}

describe('Inicio de TRAMA', () => {
  it('usa la identidad autenticada y distingue los ejemplos de los datos de la cuenta', () => {
    abrir()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Hola, Nora.',
    )
    expect(screen.queryByText(usuario.email)).not.toBeInTheDocument()
    expect(
      screen.getByText(/son ficticios y no corresponden a tu cuenta/),
    ).toBeVisible()
    const acompanamientos = screen.getByRole('region', {
      name: 'Acompañamientos activos',
    })
    expect(acompanamientos).toHaveAccessibleDescription(/Vista de ejemplo/)
    for (const nombre of ['Familia', 'Escuela', 'Profesionales']) {
      expect(
        within(acompanamientos).getByRole('heading', { name: nombre }),
      ).toBeVisible()
    }
    expect(
      screen.getByRole('heading', { name: 'Reunión con la docente' }),
    ).toBeVisible()
    expect(screen.getByText('15:00 – 16:00')).toBeVisible()
    expect(
      screen.getByText(/Estos recursos estarán disponibles próximamente/),
    ).toBeVisible()
  })

  it('permite navegar por teclado a un módulo pendiente y regresar', async () => {
    const user = userEvent.setup()
    abrir()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(
      within(nav).getByRole('link', { name: 'Acompañamientos' }),
    ).toHaveAttribute('aria-current', 'page')
    within(nav).getByRole('link', { name: 'Calendario' }).focus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Calendario · Próximamente' }),
    ).toHaveFocus()
    expect(
      within(nav).getByRole('link', { name: 'Calendario' }),
    ).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('link', { name: 'Volver al inicio' }))
    expect(
      screen.queryByText('Este espacio todavía no está disponible.'),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['familia', 'Acompañamientos'],
    ['recursos', 'Recursos'],
    ['guias', 'Recursos'],
    ['estrategias', 'Recursos'],
    ['comunidad', 'Recursos'],
    ['calendario', 'Calendario'],
    ['perfil', 'Mi perfil'],
  ])('marca una única opción activa para %s', (seccion, opcion) => {
    abrir(`/inicio?seccion=${seccion}`)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: opcion })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getAllByRole('link', { current: 'page' })).toHaveLength(
      1,
    )
  })

  it.each([
    ['Ver Familia · Próximamente', 'Familia'],
    ['Ver calendario · Próximamente', 'Calendario'],
    ['Guías y materiales · Próximamente', 'Guías y materiales'],
    ['Ver todos · Próximamente', 'Recursos'],
  ])(
    'el acceso %s identifica la funcionalidad pendiente',
    async (enlace, titulo) => {
      const user = userEvent.setup()
      abrir()
      await user.click(screen.getByRole('link', { name: enlace, exact: true }))
      expect(
        screen.getByRole('heading', { name: `${titulo} · Próximamente` }),
      ).toHaveFocus()
    },
  )

  it('enlaza el sidebar y Ver todos a Acompañamientos', () => {
    abrir()
    expect(
      screen.getByRole('link', { name: 'Acompañamientos', exact: true }),
    ).toHaveAttribute('href', '/acompanamientos')
    expect(
      screen.getByRole('link', { name: 'Ver todos los acompañamientos' }),
    ).toHaveAttribute('href', '/acompanamientos')
  })

  it('reutiliza el cierre de sesión desde el único botón del sidebar', async () => {
    const user = userEvent.setup()
    const { cerrarSesion } = abrir()
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' })
    expect(boton).toHaveAttribute('type', 'button')
    expect(boton.textContent).toBe('')
    expect(boton.querySelector('img')).toHaveAttribute(
      'src',
      '/assets/branding/cerrar sesion.png',
    )
    expect(boton.querySelector('img')).toHaveAttribute('alt', '')
    await user.click(boton)
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
    expect(cerrarSesion).toHaveBeenCalledWith()
  })

  it('permite cerrar sesión al pulsar la imagen completa o usar el teclado', async () => {
    const user = userEvent.setup()
    const { cerrarSesion } = abrir()
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' })
    await user.click(boton.querySelector('img'))
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
    boton.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(cerrarSesion).toHaveBeenCalledTimes(3)
  })

  it.each(['no-existe', '__proto__', 'constructor'])(
    'ignora una sección desconocida: %s',
    (seccion) => {
      abrir(`/inicio?seccion=${seccion}`)
      expect(
        screen.queryByText('Este espacio todavía no está disponible.'),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Hola, Nora.',
      )
    },
  )
})

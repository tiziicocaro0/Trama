import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes.jsx'
import AuthProvider from '../features/auth/AuthProvider.jsx'

function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Navegación de bienvenida', () => {
  it('muestra identidad y acciones accesibles', () => {
    renderRoute()
    expect(screen.getByRole('img', { name: 'TRAMA' })).toHaveAttribute(
      'src',
      '/assets/branding/image.png',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Distintas miradas,una misma persona.',
    )
    expect(
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    )
  })

  it.each([
    ['Iniciar sesión', '/login'],
    ['Crear cuenta', '/registro'],
  ])('permite acceder por teclado a %s y volver', async (title, path) => {
    const user = userEvent.setup()
    renderRoute()
    screen.getByRole('link', { name: title }).focus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', {
        name: title === 'Crear cuenta' ? 'Crear tu cuenta' : 'Hola de nuevo',
      }),
    ).toBeInTheDocument()
    if (path === '/login')
      expect(
        screen.getByRole('form', { name: 'Iniciar sesión' }),
      ).toBeInTheDocument()
    else
      expect(
        screen.getByRole('textbox', { name: 'Nombre' }),
      ).toBeInTheDocument()
    expect(document.title).toBe(`TRAMA · ${title}`)
    await user.click(
      screen.getByRole('link', { name: /volver a la bienvenida/i }),
    )
    expect(screen.getByRole('link', { name: title })).toHaveAttribute(
      'href',
      path,
    )
  })

  it.each(['/login'])(
    'permite cargar directamente el formulario de %s',
    (path) => {
      renderRoute(path)
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
        'type',
        'password',
      )
    },
  )

  it('permite cargar directamente el formulario de registro', () => {
    renderRoute('/registro')
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
    expect(screen.queryByText('Pantalla temporal')).not.toBeInTheDocument()
  })

  it('ofrece volver cuando la ruta no existe', () => {
    renderRoute('/no-existe')
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver/ })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

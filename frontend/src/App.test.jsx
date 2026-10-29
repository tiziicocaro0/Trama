import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import CampoContrasena from './components/ui/CampoContrasena.jsx';
import CampoFormulario from './components/ui/CampoFormulario.jsx';
import { clienteApi } from './api/cliente.js';
import { PROYECTOS_MOCK } from './api/proyectos.mock.js';

vi.mock('./api/cliente.js', () => {
  const cliente = { defaults: { baseURL: '/api' }, get: vi.fn() };
  return { default: cliente, clienteApi: cliente };
});

beforeEach(() => {
  clienteApi.get.mockReset().mockResolvedValue({ data: PROYECTOS_MOCK });
});

// La sesión real la da AuthProvider (1.1); acá se simula un usuario logueado.
vi.mock('./hooks/useAuth', async (importOriginal) => {
  const original = await importOriginal();
  const sesion = () => ({ usuario: original.USUARIO_MOCK, estado: 'autenticado' });
  return { ...original, useAuth: sesion, default: sesion };
});

describe('Arquitectura base del Frontend (0.14)', () => {
  it('/proyectos redirige a Acompañamientos y lista los proyectos que devuelve la API', async () => {
    render(
      <MemoryRouter initialEntries={['/proyectos']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Acompañamientos' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tomás')).toBeInTheDocument();
    expect(screen.getByText('Martina')).toBeInTheDocument();
    expect(screen.getByText('Joaquín')).toBeInTheDocument();
  });
  it('renderiza la página /componentes en entorno de desarrollo', () => {
    render(
      <MemoryRouter initialEntries={['/componentes']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('Catálogo de componentes UI')).toBeInTheDocument();
    expect(screen.getByText('Paleta de colores oficial')).toBeInTheDocument();
  });
  it('alterna la visibilidad en CampoContrasena al hacer clic en el ícono de ojito', async () => {
    render(
      <CampoFormulario id="clave" label="Clave secreta">
        <CampoContrasena name="clave" />
      </CampoFormulario>,
    );
    const input = screen.getByLabelText('Clave secreta');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(
      screen.getByRole('button', { name: /mostrar contraseña/i }),
    );
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(
      screen.getByRole('button', { name: /ocultar contraseña/i }),
    );
    expect(input).toHaveAttribute('type', 'password');
  });
});

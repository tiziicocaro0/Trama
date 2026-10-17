import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { CampoContraseña } from './components/ui/CampoContraseña';

describe('Arquitectura base del Frontend (0.14)', () => {
  it('accede directamente a /proyectos con la sesión mockeada de useAuth y filtra por miembro', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Acompañamientos' })).toBeInTheDocument();
    expect(screen.getByText('Tomás')).toBeInTheDocument();
    expect(screen.getByText('Martina')).toBeInTheDocument();
    expect(screen.getByText('Joaquín')).toBeInTheDocument();
    // Lucía pertenece a otro usuario y no debe mostrarse
    expect(screen.queryByText('Lucía')).not.toBeInTheDocument();
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

  it('alterna la visibilidad en CampoContraseña al hacer clic en el ícono de ojito', async () => {
    render(<CampoContraseña etiqueta="Clave secreta" />);

    const input = screen.getByLabelText('Clave secreta');
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: /mostrar contraseña/i }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(input).toHaveAttribute('type', 'password');
  });
});

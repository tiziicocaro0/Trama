import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clienteApi } from '../api/cliente';
import { useAuth } from '../hooks/useAuth';
import { Red } from './Red';

vi.mock('../hooks/useAuth', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useAuth: vi.fn(),
    default: vi.fn(),
  };
});

vi.mock('../api/cliente', () => ({
  clienteApi: {
    delete: vi.fn(),
  },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockDelete = vi.mocked(clienteApi.delete);

function renderRed() {
  return render(
    <MemoryRouter
      initialEntries={['/proyectos/11111111-1111-1111-1111-111111111111/red']}
    >
      <Routes>
        <Route path="/proyectos/:id/red" element={<Red />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Red — Quitar acceso a un miembro (Tarea 1.3)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockDelete.mockReset();
  });

  it('NO muestra el botón "Quitar acceso" si el usuario actual no es Admin', () => {
    mockUseAuth.mockReturnValue({
      usuario: {
        id: '00000000-0000-0000-0000-000000000002',
        nombre: 'María',
        rol: 'Docente',
      },
      estado: 'autenticado',
    });

    renderRed();

    expect(screen.getByText('María Díaz')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /quitar acceso/i }),
    ).not.toBeInTheDocument();
  });

  it('abre el modal con el texto exacto al hacer clic en "Quitar acceso" cuando el usuario es Admin', async () => {
    mockUseAuth.mockReturnValue({
      usuario: {
        id: '00000000-0000-0000-0000-000000000001',
        nombre: 'Marta',
        rol: 'Admin',
      },
      estado: 'autenticado',
    });

    renderRed();

    const botonesQuitar = screen.getAllByRole('button', {
      name: /quitar acceso/i,
    });
    expect(botonesQuitar.length).toBeGreaterThan(0);

    await userEvent.click(
      screen.getByRole('button', { name: 'Quitar acceso a María Díaz' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(
        '¿Quitarle el acceso a María Díaz? Sus aportes van a quedar en el perfil.',
      ),
    ).toBeInTheDocument();
  });

  it('elimina al miembro de la lista local tras confirmar con éxito y muestra Aviso si falla', async () => {
    mockUseAuth.mockReturnValue({
      usuario: {
        id: '00000000-0000-0000-0000-000000000001',
        nombre: 'Marta',
        rol: 'Admin',
      },
      estado: 'autenticado',
    });

    mockDelete.mockResolvedValueOnce({ data: null });

    renderRed();

    await userEvent.click(
      screen.getByRole('button', { name: 'Quitar acceso a María Díaz' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mockDelete).toHaveBeenCalledWith(
      '/proyectos/11111111-1111-1111-1111-111111111111/miembros/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    );
    expect(screen.queryByText('María Díaz')).not.toBeInTheDocument();

    mockDelete.mockRejectedValueOnce({
      response: {
        data: {
          mensaje:
            'No podés quitar el acceso al único administrador del proyecto',
        },
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Quitar acceso a Marta Fernández' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No podés quitar el acceso al único administrador del proyecto',
    );
  });
});


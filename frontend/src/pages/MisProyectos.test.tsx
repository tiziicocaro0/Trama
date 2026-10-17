import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clienteApi } from '../api/cliente';
import { PROYECTOS_MOCK, type ProyectoResumen } from '../api/proyectos';
import { USUARIO_MOCK } from '../hooks/useAuth';
import { MisProyectos } from './MisProyectos';

vi.mock('../api/cliente', () => ({
  TOKEN_KEY: 'trama_token',
  USUARIO_KEY: 'trama_usuario',
  clienteApi: {
    get: vi.fn(),
  },
}));

const mockGet = vi.mocked(clienteApi.get);

const tomas: ProyectoResumen = PROYECTOS_MOCK[0];
const martina: ProyectoResumen = PROYECTOS_MOCK[1];
const luciaAjena: ProyectoResumen = PROYECTOS_MOCK[3];

function renderMisProyectos() {
  return render(
    <MemoryRouter initialEntries={['/proyectos']}>
      <Routes>
        <Route path="/proyectos" element={<MisProyectos />} />
        <Route path="/proyectos/nuevo" element={<div>Pantalla crear perfil</div>} />
        <Route path="/proyectos/:id" element={<div>Portada del proyecto</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MisProyectos (Tarea 1.10)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('filtra los proyectos y muestra solo aquellos donde el usuario actual es miembro', async () => {
    mockGet.mockResolvedValueOnce({
      data: [tomas, martina, luciaAjena],
    });

    renderMisProyectos();

    expect(mockGet).toHaveBeenCalledWith('/proyectos');
    expect(await screen.findByText('Tomás')).toBeInTheDocument();
    expect(screen.getByText('Martina')).toBeInTheDocument();
    expect(screen.getByText('Madre')).toBeInTheDocument();
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
    // Lucía no incluye a USUARIO_MOCK.id en miembrosIds y no debe renderizarse
    expect(luciaAjena.miembrosIds).not.toContain(USUARIO_MOCK.id);
    expect(screen.queryByText('Lucía')).not.toBeInTheDocument();
  });

  it('muestra el estado vacío con mensaje de bienvenida y el Boton navega a /proyectos/nuevo (Estado 0)', async () => {
    mockGet.mockResolvedValueOnce({ data: [luciaAjena] });
    renderMisProyectos();

    expect(await screen.findByText(/te damos la bienvenida a trama/i)).toBeInTheDocument();

    const botonCrear = screen.getByRole('button', { name: /crear el perfil de mi hijo\/a/i });
    await userEvent.click(botonCrear);

    expect(screen.getByText('Pantalla crear perfil')).toBeInTheDocument();
  });

  it('redirige automáticamente a /proyectos/:id cuando el usuario participa en 1 solo proyecto (Estado 1)', async () => {
    mockGet.mockResolvedValueOnce({ data: [tomas, luciaAjena] });
    renderMisProyectos();

    expect(await screen.findByText('Portada del proyecto')).toBeInTheDocument();
    expect(screen.queryByText('Tomás')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clienteApi } from '../api/cliente';
import { PROYECTOS_MOCK } from '../api/proyectos';
import { USUARIO_MOCK } from '../hooks/useAuth';
import { MisProyectos } from './MisProyectos';
// La sesión real la da AuthProvider (1.1); acá se simula un usuario logueado.
vi.mock('../hooks/useAuth', async (importOriginal) => {
  const original = await importOriginal();
  const sesion = () => ({ usuario: original.USUARIO_MOCK, estado: 'autenticado' });
  return { ...original, useAuth: sesion, default: sesion };
});
vi.mock('../api/cliente', () => {
  const cliente = { defaults: { baseURL: '/api' }, get: vi.fn() };
  return { clienteApi: cliente, default: cliente };
});
const mockGet = vi.mocked(clienteApi.get);
const tomas = PROYECTOS_MOCK[0];
const martina = PROYECTOS_MOCK[1];
const luciaAjena = PROYECTOS_MOCK[3];
function renderMisProyectos() {
  return render(
    <MemoryRouter initialEntries={['/proyectos']}>
      <Routes>
        <Route path="/proyectos" element={<MisProyectos />} />
        <Route
          path="/proyectos/nuevo"
          element={<div>Pantalla crear perfil</div>}
        />
        <Route
          path="/proyectos/:id"
          element={<div>Portada del proyecto</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
describe('MisProyectos (Tarea 1.10)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });
  it('muestra error sin sustituir la API por proyectos ficticios', async () => {
    mockGet.mockRejectedValueOnce(new Error('Sin conexión'));
    renderMisProyectos();
    expect(await screen.findByText(/no pudimos cargar tus proyectos/i)).toBeInTheDocument();
    expect(screen.queryByText('Tomás')).not.toBeInTheDocument();
    expect(screen.queryByText('Portada del proyecto')).not.toBeInTheDocument();
  });
  it('completa las tarjetas con fechas de nacimiento reales del detalle', async () => {
    mockGet.mockImplementation(async (ruta) => ({ data: ruta === '/proyectos'
      ? [{ id: tomas.id, nombre: 'Niño de ejemplo', rol: 'TUTOR' }, { id: martina.id, nombre: 'Otra niña', rol: 'SALUD' }]
      : { id: ruta.split('/').at(-1), nombre: ruta.endsWith(tomas.id) ? 'Niño de ejemplo' : 'Otra niña', fechaNacimiento: '2020-01-01' }
    }));
    renderMisProyectos();
    expect(await screen.findByText('Niño de ejemplo')).toBeInTheDocument();
    expect(screen.getAllByText(/\d+ años/)).toHaveLength(2);
    expect(screen.getByText('Tutor/a')).toBeInTheDocument();
    expect(screen.getByText('Salud')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /niño de ejemplo/i })).toHaveAttribute('href', `/proyectos/${tomas.id}`);
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
    expect(
      await screen.findByText(/te damos la bienvenida a trama/i),
    ).toBeInTheDocument();
    const botonCrear = screen.getByRole('button', {
      name: /crear el perfil de mi hijo\/a/i,
    });
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

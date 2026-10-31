import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { obtenerMisProyectos } from '../api/proyectos.js';
import { PROYECTOS_MOCK } from '../api/proyectos.mock.js';
import { Layout } from '../components/layout/Layout.jsx';
import { useProyectoActual } from './useProyectoActual.js';

vi.mock('../api/proyectos.js', () => ({
  obtenerMisProyectos: vi.fn(),
}));

vi.mock('./useAuth', async (importOriginal) => {
  const original = await importOriginal();
  const sesion = () => ({
    usuario: original.USUARIO_MOCK,
    estado: 'autenticado',
    cerrarSesion: vi.fn(),
  });
  return { ...original, useAuth: sesion, default: sesion };
});

function PortadaMock() {
  const { id } = useParams();
  return <div>{`Portada del proyecto ${id}`}</div>;
}

function renderConLayout(rutaInicial = '/proyectos') {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/proyectos" element={<div>Listado de proyectos</div>} />
          <Route path="/proyectos/:id" element={<PortadaMock />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Selector de proyecto y rol por niño (Tarea 1.7)', () => {
  beforeEach(() => {
    clienteApi.get.mockReset().mockResolvedValue({
      data: PROYECTOS_MOCK,
    });
  });

  it('devuelve el proyecto actual y el rol del usuario en useProyectoActual', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={[`/proyectos/${PROYECTOS_MOCK[1].id}`]}>
        <Routes>
          <Route path="/proyectos/:id" element={children} />
        </Routes>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useProyectoActual(), { wrapper });

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.proyectoActual?.nombre).toBe('Martina');
    expect(result.current.rol).toBe('Terapeuta');
    expect(result.current.rolCodigo).toBe('SALUD');
    expect(result.current.esAdmin).toBe(false);
    expect(result.current.proyectos).toHaveLength(PROYECTOS_MOCK.length);
    expect(result.current.proyectos).toEqual(PROYECTOS_MOCK);
    expect(result.current.proyectos).not.toBe(PROYECTOS_MOCK);
  });

  it('muestra el selector en el encabezado con todos los niños del usuario y navega a la portada al elegir uno', async () => {
    renderConLayout('/proyectos');

    const selector = await screen.findByLabelText('Niño o niña');
    const opciones = Array.from(selector.querySelectorAll('option')).map(
      (opt) => opt.textContent,
    );

    expect(opciones).toEqual(
      PROYECTOS_MOCK.map((p) => `${p.nombre} (${p.rol})`),
    );

    await userEvent.selectOptions(selector, PROYECTOS_MOCK[1].id);

    expect(
      await screen.findByText(`Portada del proyecto ${PROYECTOS_MOCK[1].id}`),
    ).toBeInTheDocument();
  });

  it('muestra u oculta opciones del menú lateral según el rol cuando el usuario cambia entre 2 niños con roles distintos', async () => {
    renderConLayout(`/proyectos/${PROYECTOS_MOCK[0].id}`);

    const selector = await screen.findByLabelText('Niño o niña');
    expect(selector).toHaveValue(PROYECTOS_MOCK[0].id);

    // En Tomás el usuario es Madre (tutora administradora): ve "Invitar", "Datos y notas" y "Bitácora"
    expect(screen.getByRole('link', { name: 'Invitar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Datos y notas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();

    // Cambia a Martina donde su rol es Terapeuta (SALUD, no admin): oculta "Invitar" y mantiene el resto
    await userEvent.selectOptions(selector, PROYECTOS_MOCK[1].id);

    expect(screen.queryByRole('link', { name: 'Invitar' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Datos y notas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();

    // Cambia a Joaquín donde su rol es Docente (EDUCACION, no admin): tampoco ve "Invitar"
    await userEvent.selectOptions(selector, PROYECTOS_MOCK[2].id);

    expect(screen.queryByRole('link', { name: 'Invitar' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();
  });

  it('no muestra datos de ejemplo si la API de proyectos falla', async () => {
    clienteApi.get.mockReset().mockRejectedValue(new Error('Sin conexión'));
    const { result } = renderHook(() => useProyectoActual(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.proyectos).toEqual([]);
    expect(result.current.proyectoActual).toBeNull();
  });
});

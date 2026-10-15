import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MisProyectos from './MisProyectos';
import { getProyectos, type Proyecto } from '../services/proyectos';

vi.mock('../services/proyectos', () => ({ getProyectos: vi.fn() }));

const mockGetProyectos = vi.mocked(getProyectos);

const usuario = { nombre: 'Zoe' };

const tomas: Proyecto = {
  id: '1',
  nombre: 'Tomás',
  apodo: 'Tomi',
  foto: null,
  iniciales: 'TO',
  tono: 'terracota',
  rol: 'Madre',
  edad: '6 años',
  actualizado: 'Actualizado hoy',
  tieneActualizacionPendiente: true,
};
const martina: Proyecto = {
  id: '2',
  nombre: 'Martina',
  apodo: null,
  foto: null,
  iniciales: 'MA',
  tono: 'agua',
  rol: 'Terapeuta',
  edad: '4 años',
  actualizado: 'Actualizado ayer',
  tieneActualizacionPendiente: false,
};

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/proyectos']}>
      <Routes>
        <Route path="/proyectos" element={<MisProyectos />} />
        <Route path="/proyectos/nuevo" element={<div>Pantalla nuevo</div>} />
        <Route path="/proyectos/:id" element={<div>Portada del proyecto</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MisProyectos', () => {
  beforeEach(() => {
    mockGetProyectos.mockReset();
  });

  it('saluda con el nombre del usuario y renderiza una tarjeta por proyecto con su rol', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas, martina] });
    renderPagina();

    expect(await screen.findByRole('heading', { name: /hola, zoe/i })).toBeInTheDocument();
    expect(screen.getByText('Tomás')).toBeInTheDocument();
    expect(screen.getByText('Martina')).toBeInTheDocument();
    expect(screen.getByText('Madre')).toBeInTheDocument();
    expect(screen.getByText('Terapeuta')).toBeInTheDocument();
    expect(screen.getByText('6 años')).toBeInTheDocument();
    expect(screen.getByLabelText('Actualización pendiente')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('muestra el estado vacío con el botón hacia /proyectos/nuevo', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [] });
    renderPagina();

    const boton = await screen.findByRole('link', { name: /crear el perfil de mi hijo\/a/i });
    expect(boton).toHaveAttribute('href', '/proyectos/nuevo');
    expect(screen.getByText(/bienvenida/i)).toBeInTheDocument();
  });

  it('redirige a la portada cuando hay un solo proyecto', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas] });
    renderPagina();

    expect(await screen.findByText('Portada del proyecto')).toBeInTheDocument();
    expect(screen.queryByText('Tomás')).not.toBeInTheDocument();
  });
});

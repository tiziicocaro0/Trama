import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProyectoDetalle from './ProyectoDetalle';
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
  tieneActualizacionPendiente: false,
  escuela: 'Escuela Norte',
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

function renderDetalle(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}`]}>
      <Routes>
        <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
        <Route path="/proyectos" element={<div>Listado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProyectoDetalle', () => {
  beforeEach(() => {
    mockGetProyectos.mockReset();
  });

  it('muestra el perfil y sólo las filas de los campos existentes', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas, martina] });
    renderDetalle('1');

    expect(await screen.findByRole('heading', { name: 'Tomás' })).toBeInTheDocument();
    expect(screen.getByText('Edad')).toBeInTheDocument();
    expect(screen.getByText('Escuela Norte')).toBeInTheDocument();
    expect(screen.getByText('Madre')).toBeInTheDocument();
    expect(screen.queryByText('Diagnóstico')).not.toBeInTheDocument();
    expect(screen.queryByText('Intereses')).not.toBeInTheDocument();
  });

  it('cambia de pestaña', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas, martina] });
    renderDetalle('1');
    await screen.findByRole('heading', { name: 'Tomás' });

    expect(screen.getByRole('tab', { name: 'Información' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Red' }));

    expect(screen.getByRole('tab', { name: 'Red' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/disponible próximamente/i)).toBeInTheDocument();
    expect(screen.queryByText('Edad')).not.toBeInTheDocument();
  });

  it('muestra el botón volver cuando hay más de un proyecto', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas, martina] });
    renderDetalle('2');

    const volver = await screen.findByRole('link', { name: /volver a acompañamientos/i });
    expect(volver).toHaveAttribute('href', '/proyectos');
  });

  it('oculta el botón volver cuando hay un solo proyecto (evita el bucle de redirección)', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas] });
    renderDetalle('1');

    await screen.findByRole('heading', { name: 'Tomás' });
    expect(screen.queryByRole('link', { name: /volver/i })).not.toBeInTheDocument();
  });

  it('informa cuando el proyecto no existe', async () => {
    mockGetProyectos.mockResolvedValue({ usuario, proyectos: [tomas, martina] });
    renderDetalle('999');

    expect(await screen.findByText(/no encontramos este acompañamiento/i)).toBeInTheDocument();
  });
});


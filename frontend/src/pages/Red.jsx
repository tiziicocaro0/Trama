import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MIEMBROS_MOCK,
  PROYECTOS_MOCK,
  quitarMiembroProyecto,
} from '../api/proyectos';
import { Aviso } from '../components/ui/Aviso';
import { Boton } from '../components/ui/Boton';
import { Modal } from '../components/ui/Modal';
import { Tarjeta } from '../components/ui/Tarjeta';
import { useAuth } from '../hooks/useAuth';

const CLASES_TONO = {
  terracota: 'bg-terracota text-crema',
  agua: 'bg-agua text-crema',
  oliva: 'bg-oliva text-crema',
  miel: 'bg-miel text-crema',
};

export function Red({ miembrosIniciales = MIEMBROS_MOCK }) {
  const { id: proyectoId = PROYECTOS_MOCK[0].id } = useParams();
  const auth = useAuth();
  const usuario = auth?.usuario ?? auth;
  const rolUsuario = auth?.rol ?? usuario?.rol;
  const esAdmin =
    rolUsuario === 'Admin' ||
    rolUsuario === 'ADMIN' ||
    Boolean(auth?.esAdmin ?? usuario?.esAdmin);

  const [miembros, setMiembros] = useState(miembrosIniciales);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  function abrirConfirmacion(miembro) {
    setError('');
    setMiembroSeleccionado(miembro);
  }

  function cerrarConfirmacion() {
    if (eliminando) return;
    setMiembroSeleccionado(null);
  }

  async function confirmarQuitarAcceso() {
    if (!miembroSeleccionado) return;
    setEliminando(true);
    setError('');
    try {
      await quitarMiembroProyecto(proyectoId, miembroSeleccionado.id);
      setMiembros((actuales) =>
        actuales.filter((m) => m.id !== miembroSeleccionado.id),
      );
      setMiembroSeleccionado(null);
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        'No pudimos quitar el acceso a este miembro. Intentá nuevamente.';
      setError(mensaje);
      setMiembroSeleccionado(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-14">
      <header className="mb-6">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-agua">
          Equipo de acompañamiento
        </p>
        <h1 className="mt-2 font-display text-4xl font-normal text-terracota md:text-5xl">
          Red de apoyo
        </h1>
        <p className="mt-2 font-sans text-base text-oliva/75">
          Personas que comparten miradas y acompañan el día a día.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      <ul className="flex flex-col gap-4" aria-label="Miembros de la red">
        {miembros.map((miembro) => (
          <li key={miembro.id}>
            <Tarjeta className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-sans text-base font-semibold ${CLASES_TONO[miembro.tono] ?? CLASES_TONO.terracota}`}
                >
                  {miembro.iniciales}
                </span>
                <div className="flex flex-col">
                  <strong className="font-display text-2xl font-normal text-oliva">
                    {miembro.nombre}
                  </strong>
                  <span className="font-sans text-sm text-oliva/75">
                    {miembro.detalle}
                  </span>
                  <span className="mt-1 inline-flex w-fit rounded-full bg-agua/15 px-3 py-0.5 font-sans text-xs font-semibold text-agua">
                    {miembro.rol}
                  </span>
                </div>
              </div>

              {esAdmin && (
                <div className="flex shrink-0 justify-end">
                  <Boton
                    variante="peligro"
                    onClick={() => abrirConfirmacion(miembro)}
                    aria-label={`Quitar acceso a ${miembro.nombre}`}
                  >
                    Quitar acceso
                  </Boton>
                </div>
              )}
            </Tarjeta>
          </li>
        ))}
      </ul>

      <Modal
        abierto={Boolean(miembroSeleccionado)}
        titulo="Confirmar acción"
        onCerrar={cerrarConfirmacion}
      >
        {miembroSeleccionado && (
          <div>
            <p className="mb-6">
              {`¿Quitarle el acceso a ${miembroSeleccionado.nombre}? Sus aportes van a quedar en el perfil.`}
            </p>
            <div className="flex justify-end gap-3">
              <Boton
                variante="fantasma"
                onClick={cerrarConfirmacion}
                disabled={eliminando}
              >
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                onClick={confirmarQuitarAcceso}
                disabled={eliminando}
              >
                Confirmar
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Red;


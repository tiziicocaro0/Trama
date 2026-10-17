import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  obtenerMisProyectos,
  type ProyectoResumen,
  type TonoAvatar,
} from '../api/proyectos';
import { Aviso } from '../components/ui/Aviso';
import { Boton } from '../components/ui/Boton';
import { Campo } from '../components/ui/Campo';
import { Cargando } from '../components/ui/Cargando';
import { Tarjeta } from '../components/ui/Tarjeta';
import { useAuth } from '../hooks/useAuth';

type EstadoCarga =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; proyectos: ProyectoResumen[] };

const CLASES_TONO: Record<TonoAvatar, string> = {
  terracota: 'bg-terracota text-crema',
  agua: 'bg-agua text-crema',
  oliva: 'bg-oliva text-crema',
  miel: 'bg-miel text-crema',
};

function AvatarProyecto({ proyecto }: { proyecto: ProyectoResumen }) {
  if (proyecto.foto) {
    return (
      <img
        src={proyecto.foto}
        alt=""
        className="h-16 w-16 shrink-0 rounded-full object-cover md:h-20 md:w-20"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full font-sans text-xl font-medium md:h-20 md:w-20 md:text-2xl ${CLASES_TONO[proyecto.tono]}`}
    >
      <svg
        viewBox="0 0 80 80"
        className="absolute inset-0 h-full w-full fill-none stroke-crema/45 stroke-2"
        strokeLinecap="round"
      >
        <path d="M4 57c19-19 38-7 47-24 6-11 4-22-3-26" />
      </svg>
      <span className="relative">{proyecto.iniciales}</span>
    </span>
  );
}

function HiloDecorativo() {
  return (
    <svg
      viewBox="0 0 720 92"
      preserveAspectRatio="none"
      className="mt-4 h-14 w-full fill-none stroke-miel/55 stroke-2 md:h-20"
      aria-hidden="true"
    >
      <path d="M-10 58C95 12 190 83 302 51c58-17 63-50 24-45-44 6-35 70 43 59 99-14 188-34 361-9" />
      <circle cx="326" cy="6" r="3.5" className="fill-miel/65 stroke-none" />
    </svg>
  );
}

function IconoLupa() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function EncabezadoBienvenida({ nombreUsuario }: { nombreUsuario: string }) {
  return (
    <header className="mb-6">
      <p className="font-sans text-xs font-bold uppercase tracking-widest text-agua">
        Tú espacio
      </p>
      <h1 className="mt-2 font-display text-5xl font-normal text-terracota md:text-6xl">
        Hola, {nombreUsuario}
        <span className="text-miel">.</span>
      </h1>
      <p className="mt-3 font-sans text-base text-oliva/75">
        <span className="md:hidden">Conectando miradas para acompañar mejor.</span>
        <span className="hidden md:inline">Qué bueno tenerte por acá.</span>
      </p>
      <HiloDecorativo />
    </header>
  );
}

export function MisProyectos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: 'cargando' });
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerMisProyectos(usuario.id)
      .then((proyectos) => {
        if (activo) setEstado({ tipo: 'listo', proyectos });
      })
      .catch(() => {
        if (activo) setEstado({ tipo: 'error' });
      });
    return () => {
      activo = false;
    };
  }, [usuario.id]);

  const proyectosFiltrados = useMemo(() => {
    if (estado.tipo !== 'listo') return [];
    const consulta = busqueda.trim().toLocaleLowerCase('es');
    if (!consulta) return estado.proyectos;
    return estado.proyectos.filter((p) =>
      `${p.nombre} ${p.apodo ?? ''}`.toLocaleLowerCase('es').includes(consulta),
    );
  }, [busqueda, estado]);

  if (estado.tipo === 'cargando') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-14">
        <Cargando mensaje="Cargando tus proyectos…" />
      </div>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-14">
        <Aviso tipo="error">
          No pudimos cargar tus proyectos. Intentá de nuevo más tarde.
        </Aviso>
      </div>
    );
  }

  if (estado.proyectos.length === 1) {
    return <Navigate to={`/proyectos/${estado.proyectos[0].id}`} replace />;
  }

  if (estado.proyectos.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-14">
        <EncabezadoBienvenida nombreUsuario={usuario.nombre} />
        <Tarjeta className="flex flex-col items-center py-12 text-center">
          <h2 className="font-display text-3xl font-normal text-oliva md:text-4xl">
            ¡Te damos la bienvenida a Trama!
          </h2>
          <p className="mt-3 max-w-md font-sans text-base text-oliva/75">
            Todavía no participás en ningún acompañamiento. Empezá creando el perfil de tu hijo o
            hija para sumar a quienes lo acompañan.
          </p>
          <div className="mt-8">
            <Boton onClick={() => navigate('/proyectos/nuevo')}>
              Crear el perfil de mi hijo/a
            </Boton>
          </div>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-14">
      <EncabezadoBienvenida nombreUsuario={usuario.nombre} />

      <section aria-labelledby="acompanamientos-titulo">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-agua">
          Tu red cercana
        </p>
        <h2
          id="acompanamientos-titulo"
          className="mt-1 font-display text-4xl font-bold text-oliva md:text-5xl"
        >
          Acompañamientos
        </h2>
        <p className="mt-2 font-sans text-base text-oliva/75">
          Espacios compartidos para su bienestar.
        </p>

        <div className="mt-6">
          <Campo
            etiqueta="Buscar acompañamiento"
            ocultarEtiqueta
            iconoIzquierdo={<IconoLupa />}
            type="search"
            placeholder="Buscar acompañamiento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <ul className="mt-5 flex flex-col gap-4" aria-live="polite">
          {proyectosFiltrados.map((proyecto) => (
            <li key={proyecto.id}>
              <Link
                to={`/proyectos/${proyecto.id}`}
                className="block rounded-3xl transition hover:-translate-y-0.5"
              >
                <Tarjeta className="flex items-center gap-5 hover:border-terracota/30 md:gap-6">
                  <div className="relative">
                    <AvatarProyecto proyecto={proyecto} />
                    {proyecto.tieneActualizacionPendiente && (
                      <span
                        role="img"
                        aria-label="Actualización pendiente"
                        className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-superficie bg-miel"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-baseline gap-2">
                      <strong className="truncate font-display text-2xl font-normal text-oliva md:text-3xl">
                        {proyecto.nombre}
                      </strong>
                      {proyecto.apodo && (
                        <span className="sr-only">({proyecto.apodo})</span>
                      )}
                    </div>
                    <span className="mt-0.5 font-sans text-base text-oliva">
                      {proyecto.edad}
                    </span>
                    <span className="mt-0.5 font-sans text-sm text-oliva/65">
                      {proyecto.actualizado}
                    </span>
                    <span className="mt-2 inline-flex w-fit rounded-full bg-agua/15 px-3 py-0.5 font-sans text-xs font-semibold text-agua">
                      {proyecto.rol}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-terracota"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-none stroke-current stroke-2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 5 7 7-7 7" />
                    </svg>
                  </span>
                </Tarjeta>
              </Link>
            </li>
          ))}
        </ul>

        {proyectosFiltrados.length === 0 && (
          <div className="mt-6">
            <Aviso tipo="info">
              No encontramos ese acompañamiento. Probá buscar con otro nombre.
            </Aviso>
          </div>
        )}
      </section>
    </div>
  );
}

export default MisProyectos;

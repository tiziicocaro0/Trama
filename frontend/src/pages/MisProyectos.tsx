import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getProyectos,
  type MisProyectosResponse,
  type Proyecto,
  type TonoAvatar,
} from '../services/proyectos';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; datos: MisProyectosResponse };

const TONOS: Record<TonoAvatar, string> = {
  terracota: 'bg-terracota',
  agua: 'bg-agua',
  oliva: 'bg-oliva',
  miel: 'bg-miel',
};

const FORMA_BLOB = 'rounded-[48%_52%_45%_55%/55%_45%_55%_45%]';

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-none stroke-agua stroke-[1.8]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function Hilo() {
  return (
    <svg
      viewBox="0 0 720 92"
      preserveAspectRatio="none"
      className="mt-6 h-12 w-full fill-none stroke-miel/60 stroke-[1.5] md:h-16"
      aria-hidden="true"
    >
      <path d="M-10 58C95 12 190 83 302 51c58-17 63-50 24-45-44 6-35 70 43 59 99-14 188-34 361-9" />
      <circle cx="326" cy="6" r="3.5" className="fill-miel/60 stroke-none" />
    </svg>
  );
}

function Avatar({ proyecto }: { proyecto: Proyecto }) {
  if (proyecto.foto) {
    return (
      <img
        src={proyecto.foto}
        alt=""
        className={`h-16 w-16 shrink-0 object-cover md:h-20 md:w-20 ${FORMA_BLOB}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden font-display text-2xl text-crema md:h-20 md:w-20 md:text-3xl ${FORMA_BLOB} ${TONOS[proyecto.tono]}`}
    >
      <svg
        viewBox="0 0 80 80"
        className="absolute inset-0 h-full w-full fill-none stroke-crema/50 stroke-[1.5]"
        strokeLinecap="round"
      >
        <path d="M4 57c19-19 38-7 47-24 6-11 4-22-3-26" />
      </svg>
      <span className="relative">{proyecto.iniciales}</span>
    </span>
  );
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-crema via-[#f3e7d1] to-[#efe0c6] font-sans text-oliva">
      <div className="mx-auto w-full max-w-md px-5 py-8 md:max-w-3xl md:px-10 md:py-14 lg:max-w-5xl lg:px-16">
        {children}
      </div>
    </main>
  );
}

function Bienvenida({ nombre, children }: { nombre: string; children?: React.ReactNode }) {
  return (
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-agua">Tú espacio</p>
      <h1 className="mt-2 font-display text-5xl text-terracota md:text-7xl">
        Hola, {nombre}
        <span className="text-miel">.</span>
      </h1>
      <p className="mt-3 text-base text-oliva/70 md:text-lg">Qué bueno tenerte por acá.</p>
      <Hilo />
      {children}
    </header>
  );
}

function EstadoVacio({ nombre }: { nombre: string }) {
  return (
    <>
      <Bienvenida nombre={nombre} />
      <section
        aria-labelledby="bienvenida-titulo"
        className="mt-10 flex flex-col items-center rounded-3xl bg-white/40 px-6 py-12 text-center md:px-12 md:py-16"
      >
        <h2 id="bienvenida-titulo" className="font-display text-3xl text-oliva md:text-5xl">
          ¡Te damos la bienvenida a Trama!
        </h2>
        <p className="mt-4 max-w-md text-base text-oliva/70 md:text-lg">
          Todavía no participás en ningún acompañamiento. Empezá creando el perfil de tu hijo o
          hija para sumar a quienes lo acompañan.
        </p>
        <Link
          to="/proyectos/nuevo"
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-terracota px-8 py-4 text-base font-bold text-crema transition hover:bg-terracota/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-miel sm:w-auto"
        >
          Crear el perfil de mi hijo/a
        </Link>
      </section>
    </>
  );
}

function ListaProyectos({ nombre, proyectos }: { nombre: string; proyectos: Proyecto[] }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es');
    if (!q) return proyectos;
    return proyectos.filter((p) =>
      `${p.nombre} ${p.apodo ?? ''}`.toLocaleLowerCase('es').includes(q),
    );
  }, [busqueda, proyectos]);

  return (
    <>
      <Bienvenida nombre={nombre} />

      <section aria-labelledby="proyectos-titulo" className="mt-8 md:mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-agua">Tu red cercana</p>
        <h2 id="proyectos-titulo" className="mt-1 font-display text-4xl text-oliva md:text-6xl">
          Acompañamientos
        </h2>
        <p className="mt-2 text-base text-oliva/70 md:text-lg">
          Espacios compartidos para su bienestar.
        </p>

        <label className="mt-6 flex items-center gap-3 rounded-3xl border border-miel/20 bg-crema/60 px-5 py-4 focus-within:ring-4 focus-within:ring-miel/50 lg:max-w-3xl">
          <SearchIcon />
          <span className="sr-only">Buscar acompañamiento</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar acompañamiento…"
            className="w-full bg-transparent text-base text-oliva placeholder:text-oliva/60 focus:outline-none"
          />
        </label>

        <ul
          className="mt-5 grid grid-cols-1 gap-4 md:gap-5 lg:max-w-3xl"
          aria-live="polite"
        >
          {filtrados.map((p) => (
            <li key={p.id}>
              <Link
                to={`/proyectos/${p.id}`}
                className="flex items-center gap-4 rounded-3xl bg-[#faf3e3] p-4 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-miel/50 md:gap-6 md:p-5"
              >
                <span className="relative">
                  <Avatar proyecto={p} />
                  {p.tieneActualizacionPendiente && (
                    <span
                      role="img"
                      aria-label="Actualización pendiente"
                      className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-[#faf3e3] bg-miel"
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate font-display text-2xl font-normal text-oliva md:text-3xl">
                    {p.nombre}
                    {p.apodo && (
                      <span className="ml-2 font-sans text-sm text-oliva/60">“{p.apodo}”</span>
                    )}
                  </strong>
                  <span className="text-base">{p.edad}</span>
                  <span className="text-sm text-oliva/60">{p.actualizado}</span>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-agua/15 px-3 py-0.5 text-xs font-bold text-agua">
                    {p.rol}
                  </span>
                </span>
                <span className="text-terracota">
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {filtrados.length === 0 && (
          <div className="mt-5 rounded-3xl bg-white/40 p-6 text-center lg:max-w-3xl">
            <p className="font-bold">No encontramos ese acompañamiento.</p>
            <span className="text-sm text-oliva/70">Probá buscar con otro nombre.</span>
          </div>
        )}
      </section>
    </>
  );
}

export default function MisProyectos() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    let activo = true;
    getProyectos()
      .then((datos) => {
        if (activo) setEstado({ tipo: 'listo', datos });
      })
      .catch(() => {
        if (activo) setEstado({ tipo: 'error' });
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado.tipo === 'cargando') {
    return (
      <Contenedor>
        <p role="status" className="mt-10 text-center">
          Cargando tus proyectos…
        </p>
      </Contenedor>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <Contenedor>
        <p role="alert" className="mt-10 text-center text-terracota">
          No pudimos cargar tus proyectos. Intentá de nuevo más tarde.
        </p>
      </Contenedor>
    );
  }

  const { usuario, proyectos } = estado.datos;

  if (proyectos.length === 1) {
    return <Navigate to={`/proyectos/${proyectos[0].id}`} replace />;
  }

  return (
    <Contenedor>
      {proyectos.length === 0 ? (
        <EstadoVacio nombre={usuario.nombre} />
      ) : (
        <ListaProyectos nombre={usuario.nombre} proyectos={proyectos} />
      )}
    </Contenedor>
  );
}

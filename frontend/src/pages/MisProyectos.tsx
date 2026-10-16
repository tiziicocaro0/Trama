import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Avatar from '../components/Avatar';
import { ArrowIcon, SearchIcon } from '../components/Iconos';
import { getProyectos, type MisProyectosResponse, type Proyecto } from '../services/proyectos';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; datos: MisProyectosResponse };

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-agua">
      {children}
    </p>
  );
}

function Hilo() {
  return (
    <svg
      viewBox="0 0 720 92"
      preserveAspectRatio="none"
      className="mt-5 h-12 w-full fill-none stroke-miel/60 stroke-[1.5] desk:h-16"
      aria-hidden="true"
    >
      <path d="M-10 58C95 12 190 83 302 51c58-17 63-50 24-45-44 6-35 70 43 59 99-14 188-34 361-9" />
      <circle cx="326" cy="6" r="3.5" className="fill-miel/60 stroke-none" />
    </svg>
  );
}

function Ovillo() {
  return (
    <svg
      viewBox="0 0 72 72"
      className="h-[72px] w-[72px] fill-miel/20 stroke-miel stroke-[2]"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="36" cy="36" r="27" />
      <path className="fill-none" d="M12 26c14 8 34 8 48 0M10 38c16 9 36 9 52 0M16 50c12 6 28 6 40 0" />
    </svg>
  );
}

function Bienvenida({ nombre }: { nombre: string }) {
  return (
    <header className="mb-7 desk:mb-8">
      <Eyebrow>Tú espacio</Eyebrow>
      <h1 className="mt-2 font-display text-[32px] font-normal leading-[1.15] text-terracota desk:text-[44px] desk:leading-[1.12]">
        Hola, {nombre}
        <span className="text-miel">.</span>
      </h1>
      <p className="mt-2 max-w-[520px] font-sans text-[15px] leading-[1.6] text-texto-suave desk:text-[16px] desk:leading-[1.65]">
        Qué bueno tenerte por acá.
      </p>
      <Hilo />
    </header>
  );
}

function EstadoVacio({ nombre }: { nombre: string }) {
  return (
    <>
      <Bienvenida nombre={nombre} />
      <section
        aria-labelledby="bienvenida-titulo"
        className="flex flex-col items-center gap-3 rounded-[23px] border border-borde bg-crema-card px-6 py-12 text-center shadow-suave desk:rounded-[26px]"
      >
        <Ovillo />
        <h2
          id="bienvenida-titulo"
          className="font-display text-[24px] font-normal leading-[1.2] text-oliva"
        >
          ¡Te damos la bienvenida a Trama!
        </h2>
        <p className="max-w-[420px] font-sans text-[15px] leading-[1.6] text-texto-suave">
          Todavía no participás en ningún acompañamiento. Empezá creando el perfil de tu hijo o
          hija para sumar a quienes lo acompañan.
        </p>
        <Link
          to="/proyectos/nuevo"
          className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-terracota px-8 font-sans text-[16px] font-bold text-crema transition-colors duration-[180ms] ease-in-out hover:bg-terracota/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-miel/60 sm:w-auto"
        >
          Crear el perfil de mi hijo/a
        </Link>
      </section>
    </>
  );
}

function TarjetaProyecto({ proyecto: p }: { proyecto: Proyecto }) {
  return (
    <Link
      to={`/proyectos/${p.id}`}
      className="flex min-h-[100px] items-center gap-[14px] rounded-[23px] border border-borde bg-crema-card p-4 shadow-suave transition duration-[180ms] ease-in-out hover:-translate-y-0.5 hover:border-terracota/40 hover:shadow-elevada focus:outline-none focus-visible:ring-4 focus-visible:ring-miel/50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 desk:min-h-[112px] desk:gap-[18px] desk:rounded-[26px] desk:px-[22px] desk:py-5 desk:shadow-suave-lg"
    >
      <span className="relative">
        <Avatar proyecto={p} tamano="lista" />
        {p.tieneActualizacionPendiente && (
          <span
            role="img"
            aria-label="Actualización pendiente"
            className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-crema-card bg-miel"
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <strong className="truncate font-display text-[22px] font-normal leading-[1.2] text-oliva desk:text-[25px]">
            {p.nombre}
          </strong>
          {p.apodo && (
            <span className="truncate font-sans text-[13px] text-texto-suave desk:text-[14px]">
              “{p.apodo}”
            </span>
          )}
        </span>
        <span className="mt-[5px] flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-texto-suave desk:text-[14px]">
          <span>{p.edad}</span>
          <span>{p.actualizado}</span>
        </span>
        <span className="mt-2 inline-flex w-fit rounded-full bg-agua/15 px-3 py-0.5 font-sans text-[12px] font-bold text-agua">
          {p.rol}
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-texto-suave">
        <ArrowIcon className="h-[18px] w-[18px]" />
      </span>
    </Link>
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

      <section aria-labelledby="proyectos-titulo">
        <Eyebrow>Tu red cercana</Eyebrow>
        <h2
          id="proyectos-titulo"
          className="mt-1 font-display text-[28px] font-normal leading-[1.15] text-oliva desk:text-[36px]"
        >
          Acompañamientos
        </h2>
        <p className="mt-2 font-sans text-[15px] leading-[1.6] text-texto-suave desk:text-[16px]">
          Espacios compartidos para su bienestar.
        </p>

        <label className="mt-5 flex min-h-[54px] w-full items-center gap-3 rounded-[19px] border border-borde bg-crema-card px-[18px] text-texto-suave transition-[border-color,box-shadow] duration-[180ms] ease-in-out focus-within:border-terracota/50 focus-within:ring-2 focus-within:ring-terracota/20 desk:h-[58px] desk:max-w-[720px] desk:rounded-[21px] desk:px-5">
          <SearchIcon className="h-5 w-5 text-agua" />
          <span className="sr-only">Buscar acompañamiento</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar acompañamiento…"
            className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-texto placeholder:text-texto-suave focus:outline-none"
          />
        </label>

        <ul className="mt-5 flex flex-col gap-[14px] desk:gap-[18px]" aria-live="polite">
          {filtrados.map((p) => (
            <li key={p.id}>
              <TarjetaProyecto proyecto={p} />
            </li>
          ))}
        </ul>

        {filtrados.length === 0 && (
          <div className="mt-5 rounded-[23px] border border-borde bg-crema-card px-6 py-12 text-center font-sans desk:rounded-[26px]">
            <p className="text-[16px] font-semibold text-texto">
              No encontramos ese acompañamiento.
            </p>
            <span className="mt-1 block text-[15px] text-texto-suave">
              Probá buscar con otro nombre.
            </span>
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
      <AppLayout>
        <p role="status" className="mt-10 text-center font-sans text-[16px]">
          Cargando tus proyectos…
        </p>
      </AppLayout>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <AppLayout>
        <p role="alert" className="mt-10 text-center font-sans text-[16px] text-terracota">
          No pudimos cargar tus proyectos. Intentá de nuevo más tarde.
        </p>
      </AppLayout>
    );
  }

  const { usuario, proyectos } = estado.datos;

  if (proyectos.length === 1) {
    return <Navigate to={`/proyectos/${proyectos[0].id}`} replace />;
  }

  return (
    <AppLayout>
      {proyectos.length === 0 ? (
        <EstadoVacio nombre={usuario.nombre} />
      ) : (
        <ListaProyectos nombre={usuario.nombre} proyectos={proyectos} />
      )}
    </AppLayout>
  );
}

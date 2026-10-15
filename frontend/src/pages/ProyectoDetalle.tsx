import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Avatar from '../components/Avatar';
import { ArrowIcon, DetalleIcon, PencilIcon, type DetalleIconName } from '../components/Iconos';
import { getProyectos, type Proyecto } from '../services/proyectos';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'no-encontrado' }
  | { tipo: 'listo'; proyecto: Proyecto; totalProyectos: number };

type Pestana = 'informacion' | 'red' | 'notas';

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: 'informacion', etiqueta: 'Información' },
  { id: 'red', etiqueta: 'Red' },
  { id: 'notas', etiqueta: 'Notas' },
];

const COLOR_ICONO: Record<DetalleIconName, string> = {
  edad: 'bg-oliva/15 text-oliva',
  rol: 'bg-oliva/15 text-oliva',
  apodo: 'bg-miel/20 text-miel',
  diagnostico: 'bg-agua/20 text-agua',
  escuela: 'bg-miel/20 text-miel',
  intereses: 'bg-terracota/15 text-terracota',
};

const PANEL =
  'rounded-[22px] border border-borde bg-crema-card/75 px-[18px] py-1.5 shadow-panel desk:rounded-[26px] desk:bg-crema-card/85 desk:px-6 desk:py-2.5';

interface Fila {
  icono: DetalleIconName;
  etiqueta: string;
  valor: string;
}

/** Sólo incluye los campos que existen en el modelo: no se inventan valores. */
function construirFilas(p: Proyecto): Fila[] {
  const filas: (Fila | null)[] = [
    { icono: 'edad', etiqueta: 'Edad', valor: p.edad },
    p.apodo ? { icono: 'apodo', etiqueta: 'Apodo', valor: p.apodo } : null,
    { icono: 'rol', etiqueta: 'Tu rol', valor: p.rol },
    p.diagnostico ? { icono: 'diagnostico', etiqueta: 'Diagnóstico', valor: p.diagnostico } : null,
    p.escuela ? { icono: 'escuela', etiqueta: 'Escuela', valor: p.escuela } : null,
    p.intereses ? { icono: 'intereses', etiqueta: 'Intereses', valor: p.intereses } : null,
  ];
  return filas.filter((f): f is Fila => f !== null);
}

function FilasInformacion({ proyecto }: { proyecto: Proyecto }) {
  return (
    <ul className={PANEL}>
      {construirFilas(proyecto).map((fila) => (
        <li
          key={fila.etiqueta}
          className="flex items-center gap-[14px] border-b border-borde py-4 last:border-b-0 desk:gap-4 desk:py-[18px]"
        >
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] desk:h-11 desk:w-11 ${COLOR_ICONO[fila.icono]}`}
          >
            <DetalleIcon name={fila.icono} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-sans text-[12px] font-bold text-texto-suave desk:text-[13px]">
              {fila.etiqueta}
            </span>
            <span className="break-words font-sans text-[15px] font-semibold text-texto desk:text-[16px]">
              {fila.valor}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PanelProximamente({ seccion }: { seccion: string }) {
  return (
    <div className={`${PANEL} py-6 desk:py-8`}>
      <h2 className="font-display text-[22px] font-normal leading-[1.2] text-oliva desk:text-[26px]">
        {seccion}
      </h2>
      <p className="mt-2 font-sans text-[14px] leading-[1.6] text-texto-suave desk:text-[15px]">
        Esta sección estará disponible próximamente.
      </p>
    </div>
  );
}

function DetalleProyecto({
  proyecto,
  mostrarVolver,
}: {
  proyecto: Proyecto;
  mostrarVolver: boolean;
}) {
  const [pestana, setPestana] = useState<Pestana>('informacion');

  return (
    <section aria-labelledby="detalle-titulo">
      {mostrarVolver && (
        <Link
          to="/proyectos"
          aria-label="Volver a Acompañamientos"
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-[14px] text-terracota transition-colors duration-[180ms] ease-in-out hover:bg-miel/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-miel/50"
        >
          <ArrowIcon className="h-5 w-5 rotate-180" />
        </Link>
      )}

      <div className="flex items-center gap-4 pb-6 desk:gap-6 desk:pb-8">
        <Avatar proyecto={proyecto} tamano="detalle" />
        <div className="min-w-0 flex-1">
          <h1
            id="detalle-titulo"
            className="break-words font-display text-[30px] font-normal leading-[1.15] text-oliva desk:text-[40px]"
          >
            {proyecto.nombre}
          </h1>
          <p className="font-sans text-[14px] text-texto-suave desk:text-[15px]">{proyecto.edad}</p>
          <p className="font-sans text-[14px] text-texto-suave desk:text-[15px]">
            {proyecto.actualizado}
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-label={`Editar datos de ${proyecto.nombre}`}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-miel/25 text-terracota transition-colors duration-[180ms] ease-in-out hover:bg-miel/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-miel/50 disabled:cursor-not-allowed desk:h-[46px] desk:w-[46px]"
        >
          <PencilIcon className="h-[19px] w-[19px]" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Secciones del acompañamiento"
        className="flex gap-1 rounded-[16px] bg-crema-tab p-[5px]"
      >
        {PESTANAS.map(({ id, etiqueta }) => {
          const activa = pestana === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`pestana-${id}`}
              aria-selected={activa}
              aria-controls={`panel-${id}`}
              onClick={() => setPestana(id)}
              className={`min-h-[44px] min-w-0 flex-1 truncate rounded-xl border-b-[3px] px-2 font-sans text-[14px] font-bold transition-colors duration-[180ms] ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-miel ${
                activa
                  ? 'border-miel text-terracota'
                  : 'border-transparent text-texto-suave hover:text-terracota'
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${pestana}`}
        aria-labelledby={`pestana-${pestana}`}
        className="mt-[18px] desk:mt-6"
      >
        {pestana === 'informacion' && <FilasInformacion proyecto={proyecto} />}
        {pestana === 'red' && <PanelProximamente seccion="Red" />}
        {pestana === 'notas' && <PanelProximamente seccion="Notas" />}
      </div>
    </section>
  );
}

export default function ProyectoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    let activo = true;
    getProyectos()
      .then(({ proyectos }) => {
        if (!activo) return;
        const proyecto = proyectos.find((p) => p.id === id);
        setEstado(
          proyecto
            ? { tipo: 'listo', proyecto, totalProyectos: proyectos.length }
            : { tipo: 'no-encontrado' },
        );
      })
      .catch(() => {
        if (activo) setEstado({ tipo: 'error' });
      });
    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <AppLayout>
      {estado.tipo === 'cargando' && (
        <p role="status" className="mt-10 text-center font-sans text-[16px]">
          Cargando…
        </p>
      )}
      {estado.tipo === 'error' && (
        <p role="alert" className="mt-10 text-center font-sans text-[16px] text-terracota">
          No pudimos cargar este acompañamiento. Intentá de nuevo más tarde.
        </p>
      )}
      {estado.tipo === 'no-encontrado' && (
        <div className="mt-10 text-center font-sans">
          <p className="text-[16px] font-semibold text-texto">No encontramos este acompañamiento.</p>
          <Link to="/proyectos" className="mt-2 inline-block text-[15px] text-terracota underline">
            Volver a Acompañamientos
          </Link>
        </div>
      )}
      {estado.tipo === 'listo' && (
        <DetalleProyecto
          proyecto={estado.proyecto}
          // Con un solo proyecto, /proyectos redirige acá: volver crearía un bucle.
          mostrarVolver={estado.totalProyectos > 1}
        />
      )}
    </AppLayout>
  );
}


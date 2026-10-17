import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Heart,
  House,
  Lightbulb,
  Users,
} from '@phosphor-icons/react'
import { Link } from 'react-router'
import {
  acompanamientosEjemplo,
  eventosEjemplo,
  recursosFuturos,
} from './inicio.mock.js'

const tonos = {
  familia: {
    fondo: 'bg-primario/5',
    icono: 'bg-primario/15 text-primario',
    fecha: 'bg-primario/15 text-primario',
    icon: House,
  },
  escuela: {
    fondo: 'bg-agua/10',
    icono: 'bg-agua/20 text-exito',
    fecha: 'bg-agua/20 text-secundario',
    icon: GraduationCap,
  },
  profesionales: {
    fondo: 'bg-agua/5',
    icono: 'bg-agua/20 text-secundario',
    fecha: 'bg-agua/20 text-secundario',
    icon: Heart,
  },
}
const iconosRecursos = {
  guias: { icon: BookOpen, tono: 'bg-decoracion text-primario' },
  estrategias: { icon: Lightbulb, tono: 'bg-agua/20 text-exito' },
  comunidad: { icon: Users, tono: 'bg-agua/15 text-secundario' },
}

function EnlaceInicio({ seccion, children, etiqueta, circular = false }) {
  return (
    <Link
      to={`/inicio?seccion=${seccion}`}
      aria-label={etiqueta}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full text-primario transition-colors hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none ${circular ? 'size-11 bg-superficie/65' : 'bg-decoracion/80 px-3 py-2 text-sm font-semibold'}`}
    >
      {children}
      <ArrowRight size={20} aria-hidden="true" />
    </Link>
  )
}

export function Acompanamientos() {
  return (
    <section
      aria-labelledby="acompanamientos-titulo"
      aria-describedby="aviso-ejemplos"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="acompanamientos-titulo"
          className="text-subtitulo font-semibold text-primario"
        >
          Acompañamientos activos
        </h2>
        <EnlaceInicio
          seccion="acompanamientos"
          etiqueta="Ver todos los acompañamientos"
        >
          Ver todos
        </EnlaceInicio>
      </div>
      <ul className="grid gap-3 xl:grid-cols-3">
        {acompanamientosEjemplo.map(({ id, titulo, tono }) => {
          const { fondo, icono, icon: Icon } = tonos[tono]
          return (
            <li
              key={id}
              className={`flex min-w-0 items-center gap-2 rounded-tarjeta p-3 sm:gap-3 sm:p-4 ${fondo}`}
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full sm:size-12 ${icono}`}
              >
                <Icon size={32} weight="light" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="whitespace-nowrap font-identidad text-subtitulo leading-tight text-primario">
                  {titulo}
                </h3>
                <p className="mt-1 text-xs leading-snug text-texto-suave">
                  Acompañamiento activo
                </p>
              </div>
              <EnlaceInicio
                seccion={id}
                etiqueta={`Ver ${titulo} · Próximamente`}
                circular
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Panel({ id, titulo, seccion, accion, children }) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-tarjeta border border-borde/30 bg-bienvenida-luz p-4 shadow-suave"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-identidad text-subtitulo text-primario">
          {titulo}
        </h2>
        <EnlaceInicio seccion={seccion} etiqueta={`${accion} · Próximamente`}>
          {accion}
        </EnlaceInicio>
      </div>
      {children}
    </section>
  )
}

export function Eventos() {
  return (
    <Panel
      id="eventos-titulo"
      titulo="Próximos eventos"
      seccion="calendario"
      accion="Ver calendario"
    >
      <ul
        aria-describedby="aviso-ejemplos"
        className="divide-y divide-borde/40"
      >
        {eventosEjemplo.map(({ id, dia, fecha, titulo, horario, tono }) => (
          <li key={id} className="flex items-center gap-3 py-3">
            <div
              className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-pequeno ${tonos[tono].fecha}`}
            >
              <span className="text-xs font-bold">{dia}</span>
              <span className="text-2xl font-semibold leading-none">
                {fecha}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold">{titulo}</h3>
              <p className="mt-1 text-sm text-texto-suave">{horario}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function Recursos() {
  return (
    <Panel
      id="recursos-titulo"
      titulo="Recursos destacados"
      seccion="recursos"
      accion="Ver todos"
    >
      <ul className="divide-y divide-borde/40">
        {recursosFuturos.map(({ id, titulo, descripcion }) => {
          const { icon: Icon, tono } = iconosRecursos[id]
          return (
            <li key={id} className="flex items-center gap-3 py-3">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tono}`}
              >
                <Icon size={32} weight="light" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{titulo}</h3>
                <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
              </div>
              <EnlaceInicio
                seccion={id}
                etiqueta={`${titulo} · Próximamente`}
                circular
              />
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-texto-suave">
        Estos recursos estarán disponibles próximamente.
      </p>
    </Panel>
  )
}

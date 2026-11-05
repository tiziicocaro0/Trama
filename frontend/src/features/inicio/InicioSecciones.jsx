import {
  ArrowRight,
  BookOpen,
  Lightbulb,
  Plus,
  Users,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton.jsx'
import { fechaLocal } from '../calendario/utils/periodo.js'
import { DIAS_DE_EVENTOS } from './useResumenInicio.js'
import FotoNino from '../perfil/components/FotoNino.jsx'

// Colores que se alternan entre las tarjetas para distinguirlas a simple vista.
const tonos = [
  {
    fondo: 'bg-primario/5',
    icono: 'bg-primario/15 text-primario',
    fecha: 'bg-primario/15 text-primario',
  },
  {
    fondo: 'bg-agua/10',
    icono: 'bg-agua/20 text-exito',
    fecha: 'bg-agua/20 text-secundario',
  },
  {
    fondo: 'bg-agua/5',
    icono: 'bg-agua/20 text-secundario',
    fecha: 'bg-agua/20 text-secundario',
  },
]

// Módulos que todavía no existen: se muestran como "Próximamente", sin enlaces.
const recursosFuturos = [
  {
    titulo: 'Guías y materiales',
    descripcion: 'Recursos para el día a día',
    icon: BookOpen,
    tono: 'bg-decoracion text-primario',
  },
  {
    titulo: 'Estrategias',
    descripcion: 'Herramientas prácticas',
    icon: Lightbulb,
    tono: 'bg-agua/20 text-exito',
  },
  {
    titulo: 'Comunidad',
    descripcion: 'Experiencias y consejos',
    icon: Users,
    tono: 'bg-agua/15 text-secundario',
  },
]

const CLASE_ENLACE =
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-decoracion/80 px-3 py-2 text-sm font-semibold text-primario transition-colors hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none'

function EstadoCarga({ resumen, cargandoTexto }) {
  if (resumen.cargando) return <p role="status">{cargandoTexto}</p>
  return (
    <div className="space-y-3 rounded-lg bg-superficie p-4">
      <p role="alert">No pudimos cargar esta información.</p>
      <Boton variant="secondary" onClick={resumen.reintentar}>
        Reintentar
      </Boton>
    </div>
  )
}

export function Acompanamientos({ resumen }) {
  const { proyectos } = resumen
  return (
    <section aria-labelledby="acompanamientos-titulo">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="acompanamientos-titulo" className="text-subtitulo font-semibold text-primario">
          Tus acompañamientos
        </h2>
        <Link
          to="/acompanamientos"
          aria-label="Ver todos los acompañamientos"
          className={CLASE_ENLACE}
        >
          Ver todos
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
      {resumen.cargando || resumen.error ? (
        <EstadoCarga resumen={resumen} cargandoTexto="Cargando tus acompañamientos…" />
      ) : proyectos.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-primario/5 p-5">
          <p className="font-semibold">Todavía no acompañás a ningún niño.</p>
          <p className="text-texto-suave">
            Creá su perfil para empezar, o pedile a su familia que te invite.
          </p>
          <Boton to="/acompanamientos/nuevo">
            <Plus size={20} aria-hidden="true" />
            Crear acompañamiento
          </Boton>
        </div>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-3">
          {proyectos.slice(0, 3).map((proyecto, indice) => {
            const { fondo, icono } = tonos[indice % tonos.length]
            const nombre = proyecto.apodo || proyecto.nombre
            return (
              <li key={proyecto.id}>
                <Link
                  to={`/proyectos/${proyecto.id}`}
                  className={`flex min-w-0 items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none sm:p-4 ${fondo}`}
                >
                  <FotoNino
                    proyecto={proyecto}
                    className="size-11 sm:size-12"
                    claseIcono={icono}
                    tamanoIcono={32}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-subtitulo leading-tight text-primario">
                      {nombre}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-texto-suave">
                      {[proyecto.rol, proyecto.edad].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <ArrowRight size={20} aria-hidden="true" className="shrink-0 text-primario" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Panel({ id, titulo, accion, children }) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-lg border border-borde/30 bg-bienvenida-luz p-4 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-display text-subtitulo text-primario">
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

function diaDeLaSemana(fecha) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
    .format(fechaLocal(fecha))
    .replace('.', '')
    .toLocaleUpperCase('es')
}

function horario({ horaInicio, horaFin }) {
  const corta = (valor) => (typeof valor === 'string' ? valor.slice(0, 5) : '')
  return [corta(horaInicio), corta(horaFin)].filter(Boolean).join(' – ')
}

export function Eventos({ resumen }) {
  const { eventos } = resumen
  return (
    <Panel
      id="eventos-titulo"
      titulo="Próximos eventos"
      accion={
        <Link to="/inicio?seccion=calendario" className={CLASE_ENLACE}>
          Ver calendario
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      }
    >
      {resumen.cargando || resumen.error ? (
        <EstadoCarga resumen={resumen} cargandoTexto="Cargando tus próximos eventos…" />
      ) : eventos.length === 0 ? (
        <p className="py-3 text-texto-suave">
          No hay eventos en los próximos {DIAS_DE_EVENTOS} días.
        </p>
      ) : (
        <ul className="divide-y divide-borde/40">
          {eventos.map((evento, indice) => (
            <li key={`${evento.proyectoId}-${evento.id}-${evento.fecha}`}>
              <Link
                to={`/proyectos/${evento.proyectoId}/calendario?fecha=${evento.fecha}`}
                className="flex items-center gap-3 rounded-md py-3 hover:bg-decoracion/40 focus-visible:outline-2 focus-visible:outline-primario"
              >
                <span
                  className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-sm ${tonos[indice % tonos.length].fecha}`}
                >
                  <span className="text-xs font-bold">{diaDeLaSemana(evento.fecha)}</span>
                  <span className="text-2xl font-semibold leading-none">
                    {Number(evento.fecha.slice(8, 10))}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block break-words font-bold">{evento.titulo}</span>
                  <span className="mt-1 block text-sm text-texto-suave">
                    {[horario(evento), evento.proyectoNombre].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function Recursos() {
  return (
    <Panel
      id="recursos-titulo"
      titulo="Recursos"
      accion={
        <span className="rounded-full bg-decoracion px-3 py-1 text-sm font-semibold text-primario">
          Próximamente
        </span>
      }
    >
      <ul className="divide-y divide-borde/40">
        {recursosFuturos.map(({ titulo, descripcion, icon: Icon, tono }) => (
          <li key={titulo} className="flex items-center gap-3 py-3">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tono}`}>
              <Icon size={32} weight="light" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{titulo}</span>
              <span className="mt-1 block text-sm text-texto-suave">{descripcion}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-texto-suave">
        Estamos preparando guías, estrategias y un espacio para compartir experiencias.
      </p>
    </Panel>
  )
}

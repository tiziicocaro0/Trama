import {
  ArrowRight,
  Heart,
  NotePencil,
  Sun,
} from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import useVistaSimple from '../useVistaSimple.js'

export default function VistaSimplePortada({ id }) {
  const { setVistaSimple } = useVistaSimple()
  const location = useLocation()
  const observacionGuardada = location.state?.mensaje === 'Observación guardada.'

  return (
    <div className="mb-8">
        {observacionGuardada && (
        <div
            role="status"
            className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-oliva/30 bg-oliva/10 px-5 py-4"
        >
            <div>
            <p className="font-semibold text-oliva">
                Observación guardada correctamente
            </p>
            <p className="mt-1 text-sm text-texto-suave">
                Ya quedó registrada en la bitácora.
            </p>
            </div>

            <Link
            to={`/proyectos/${id}/bitacora`}
            className="font-semibold text-primario underline underline-offset-4"
            >
            Ver en Bitácora
            </Link>
        </div>
        )}
      <Link
        to={`/proyectos/${id}/conocelo`}
        className="group relative flex min-h-36 items-center justify-between overflow-hidden rounded-lg border border-primario/10 bg-superficie px-7 py-6 shadow-sm transition hover:shadow-md"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 360 120"
          fill="none"
          className="pointer-events-none absolute right-40 -top-3 hidden h-20 w-60 text-miel/70 md:block"
        >
          <path
            d="M8 72
              C 75 22, 150 108, 220 58
              C 252 36, 277 22, 296 30
              C 315 38, 314 63, 294 74
              C 275 84, 257 72, 261 55
              C 266 34, 301 23, 347 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative z-10 flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primario text-xl font-bold text-superficie">
            5&apos;
          </span>

          <div>
            <h2 className="font-display text-h1 text-primario">
              Conocelo en 5 minutos
            </h2>

            <p className="mt-1 text-base text-texto-suave">
              Resumen rápido del perfil
            </p>
          </div>
        </div>

        <span className="relative z-10 hidden items-center gap-3 rounded-md bg-primario px-6 py-4 font-semibold text-superficie shadow-md transition group-hover:opacity-90 sm:flex">
          Abrir resumen
          <ArrowRight size={18} />
        </span>
      </Link>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Link
          to={`/proyectos/${id}/desregulacion`}
          className="group flex min-h-40 flex-col justify-between rounded-lg border border-primario/10 bg-superficie p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-md bg-primario/10 text-primario">
              <Heart size={25} weight="fill" />
            </span>

            <span className="flex size-9 items-center justify-center rounded-full border border-primario/30 text-primario transition group-hover:bg-primario group-hover:text-superficie">
              <ArrowRight size={17} />
            </span>
          </div>

          <div className="mt-5">
            <h2 className="font-display text-h2 text-oliva">
              Si se desregula
            </h2>

            <p className="mt-1 text-base text-texto-suave">
              Qué ayuda y qué evitar
            </p>
          </div>
        </Link>

        <Link
          to={`/proyectos/${id}/hoy`}
          state={{ volverA: `/proyectos/${id}` }}
          className="group flex min-h-40 flex-col justify-between rounded-lg border border-primario/10 bg-superficie p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-md bg-oliva/15 text-oliva">
              <Sun size={26} weight="bold" />
            </span>

            <span className="flex size-9 items-center justify-center rounded-full border border-primario/30 text-primario transition group-hover:bg-primario group-hover:text-superficie">
              <ArrowRight size={17} />
            </span>
          </div>

          <div className="mt-5">
            <h2 className="font-display text-h2 text-oliva">
              Hoy
            </h2>

            <p className="mt-1 text-base text-texto-suave">
              Lo más importante para este día
            </p>
          </div>
        </Link>

        <Link
          to={`/proyectos/${id}/cargar-observacion`}
          className="group flex min-h-40 flex-col justify-between rounded-lg border border-primario/10 bg-superficie p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-md bg-miel/25 text-secundario">
              <NotePencil size={26} weight="bold" />
            </span>

            <span className="flex size-9 items-center justify-center rounded-full bg-primario text-superficie transition group-hover:opacity-90">
              +
            </span>
          </div>

          <div className="mt-5">
            <h2 className="font-display text-h2 text-oliva">
              Cargar observación
            </h2>

            <p className="mt-1 text-base text-texto-suave">
              Registrar algo que pasó
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-7 text-center">
        <p className="text-sm text-texto-suave">
          Estás en la vista simple.{' '}
          <button
            type="button"
            onClick={() => setVistaSimple(false)}
            className="font-semibold text-primario underline-offset-4 hover:underline"
          >
            Ver perfil completo
          </button>
        </p>
      </div>
    </div>
  )
}
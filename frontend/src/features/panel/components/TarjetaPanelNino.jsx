import { CaretRight, Lock, Sparkle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import FotoNino from '../../perfil/components/FotoNino.jsx'
import { calcularEdad } from '../../perfil/perfil.js'

const ETIQUETAS_ROL = {
  EDUCACION: 'Educación',
  SALUD: 'Salud',
  TUTOR: 'Tutor/a',
  FAMILIAR: 'Familiar',
}

/**
 * 7.1: Tarjeta de niño en el panel profesional.
 * Muestra novedades de los últimos 7 días, etiqueta de Solo lectura y enlace a su portada en 1 toque.
 */
export default function TarjetaPanelNino({ nino }) {
  const edad = calcularEdad(nino.fechaNacimiento)
  const etiquetaRol = ETIQUETAS_ROL[nino.rol] || nino.rol

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-lg bg-superficie p-4 shadow-sm transition-colors hover:bg-bienvenida-luz motion-reduce:transition-none sm:p-5">
      <Link
        to={`/proyectos/${nino.id}`}
        aria-label={`Ver perfil de ${nino.nombre}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario sm:gap-6"
      >
        <FotoNino
          proyecto={nino}
          className="size-16 shrink-0 sm:size-20"
          claseIcono="bg-primario text-superficie"
          tamanoIcono={36}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-display text-h2 text-secundario">
              {nino.nombre}
            </h2>
            {nino.soloLectura && (
              <span
                role="status"
                aria-label="Proyecto en solo lectura"
                className="inline-flex items-center gap-1 rounded-full bg-decoracion px-2.5 py-0.5 text-xs font-semibold text-primario"
              >
                <Lock size={12} aria-hidden="true" />
                Solo lectura
              </span>
            )}
            {etiquetaRol && (
              <span className="rounded-full border border-borde/60 bg-superficie px-2 py-0.5 text-xs text-texto-suave">
                {etiquetaRol}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-texto-suave sm:text-base">
            {edad === null
              ? 'Edad no disponible'
              : `${edad} ${edad === 1 ? 'año' : 'años'}`}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 font-medium text-secundario">
              <Sparkle size={16} aria-hidden="true" className="text-acento" />
              {nino.totalNovedades === 0
                ? 'Sin novedades esta semana'
                : `${nino.totalNovedades} ${nino.totalNovedades === 1 ? 'novedad' : 'novedades'} en los últimos 7 días`}
            </span>
            {nino.totalNovedades > 0 && (
              <span className="text-xs text-texto-suave">
                ({nino.aportesNuevos} {nino.aportesNuevos === 1 ? 'aporte' : 'aportes'}, {nino.eventosNuevos} {nino.eventosNuevos === 1 ? 'evento' : 'eventos'})
              </span>
            )}
          </div>
        </div>

        <CaretRight
          size={24}
          aria-hidden="true"
          className="shrink-0 text-primario"
        />
      </Link>
    </article>
  )
}


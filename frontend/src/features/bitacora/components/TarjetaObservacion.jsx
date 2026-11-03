import { Lock } from '@phosphor-icons/react'
import { formatearFechaHora } from '../../../utils/fechas.js'
import {
  ETIQUETAS_CONTEXTO,
  ETIQUETAS_TAG,
  leerDatosObservacion,
} from '../bitacora.js'

export default function TarjetaObservacion({ observacion, autorTexto }) {
  const info = leerDatosObservacion(observacion.datos)
  const fechaIso = info.fecha ?? observacion.creadoEn
  const fechaTexto = formatearFechaHora(fechaIso)
  const contextoTexto =
    ETIQUETAS_CONTEXTO[info.contexto] ?? info.contexto ?? 'Sin contexto'
  const esRestringido =
    observacion.visibilidad != null && observacion.visibilidad !== 'TODOS'

  return (
    <article className="rounded-lg bg-superficie p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-texto-suave">
        <p className="font-semibold text-secundario">
          <span>Autor: </span>
          <span>{autorTexto}</span>
        </p>
        <div className="flex items-center gap-2">
          {fechaTexto ? (
            <time dateTime={fechaIso}>{fechaTexto}</time>
          ) : (
            <span>Fecha no disponible</span>
          )}
          {esRestringido && (
            <Lock
              size={18}
              weight="regular"
              className="shrink-0 text-secundario"
              role="img"
              aria-label="Visibilidad restringida"
            />
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-base text-texto">
        {observacion.contenido || observacion.titulo}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-secundario px-3 py-1 text-xs font-semibold text-superficie">
          {contextoTexto}
        </span>
        {info.etiquetas.map((etiquetaCodigo) => (
          <span
            key={etiquetaCodigo}
            className="inline-flex items-center rounded-full bg-miel/30 px-3 py-1 text-xs font-semibold text-texto"
          >
            {ETIQUETAS_TAG[etiquetaCodigo] ?? etiquetaCodigo}
          </span>
        ))}
      </div>
    </article>
  )
}


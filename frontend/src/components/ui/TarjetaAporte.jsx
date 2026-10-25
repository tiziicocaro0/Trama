import { Lock } from '@phosphor-icons/react'
import { formatearFechaHora } from '../../utils/fechas.js'

function obtenerAutor(aporte, autorProp) {
  if (typeof autorProp === 'string' && autorProp.trim()) return autorProp.trim()
  if (typeof aporte?.autorNombre === 'string' && aporte.autorNombre.trim())
    return aporte.autorNombre.trim()
  if (typeof aporte?.autor === 'string' && aporte.autor.trim())
    return aporte.autor.trim()
  if (
    aporte?.autor &&
    typeof aporte.autor === 'object' &&
    typeof aporte.autor.nombre === 'string'
  ) {
    return [aporte.autor.nombre, aporte.autor.apellido]
      .filter(Boolean)
      .join(' ')
      .trim()
  }
  return null
}

export default function TarjetaAporte({
  aporte,
  autor,
  alEditar,
  alArchivar,
  archivando = false,
  resumen = false,
}) {
  const esNota = aporte.tipo === 'NOTA_PROFESIONAL'
  const fechaBase = aporte.creadoEn ?? aporte.fecha ?? null
  const fechaCreacion = fechaBase ? formatearFechaHora(fechaBase) : null
  const fechaEdicion =
    esNota &&
    aporte.actualizadoEn &&
    aporte.actualizadoEn !== aporte.creadoEn
      ? formatearFechaHora(aporte.actualizadoEn)
      : null
  const nombreAutor = obtenerAutor(aporte, autor)

  // 3.1: Identificar aportes con visibilidad restringida
  const esRestringido =
    aporte.visibilidad != null && aporte.visibilidad !== 'TODOS'

  const sustantivo = esNota ? 'nota' : 'aporte'

  return (
    <article className="flex gap-2 py-2 text-texto">
      <span
        aria-hidden="true"
        className="mt-2 size-1.5 shrink-0 rounded-full bg-miel"
      />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 break-words text-base font-semibold leading-relaxed">
          <span className="min-w-0">{aporte.titulo}</span>

          {/* 3.1: Candado para aportes restringidos */}
          {esRestringido && (
            <Lock
              size={18}
              weight="regular"
              className="shrink-0 text-secundario"
              role="img"
              aria-label="Visibilidad restringida"
            />
          )}
        </h3>

        {aporte.contenido && (
          <p
            className={`mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave ${resumen ? 'line-clamp-3' : ''}`}
          >
            {aporte.contenido}
          </p>
        )}

        {(nombreAutor || (!esNota && fechaCreacion)) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-suave">
            {nombreAutor && <span>{`Cargado por: ${nombreAutor}`}</span>}
            {!esNota && fechaCreacion && (
              <time dateTime={fechaBase}>{fechaCreacion}</time>
            )}
          </div>
        )}

        {esNota && (
          <div className="mt-3 space-y-1 text-sm text-texto-suave">
            <p>
              Creada:{' '}
              {fechaCreacion ? (
                <time dateTime={aporte.creadoEn}>{fechaCreacion}</time>
              ) : (
                'Fecha no disponible'
              )}
            </p>
            {fechaEdicion && (
              <p>
                Última edición:{' '}
                <time dateTime={aporte.actualizadoEn}>{fechaEdicion}</time>
              </p>
            )}
          </div>
        )}

        {aporte.puedeEditar && (alEditar || alArchivar) && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {alEditar && (
              <button
                type="button"
                onClick={alEditar}
                disabled={archivando}
                aria-label={`Editar ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                Editar
              </button>
            )}
            {alArchivar && (
              <button
                type="button"
                onClick={alArchivar}
                disabled={archivando}
                aria-label={`Archivar ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center rounded-sm font-semibold text-secundario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                {archivando ? 'Archivando…' : 'Archivar'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

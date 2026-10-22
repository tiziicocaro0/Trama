import { formatearFechaHora } from '../../utils/fechas.js'

export default function TarjetaAporte({ aporte, alEditar, resumen = false }) {
  const esNota = aporte.tipo === 'NOTA_PROFESIONAL'
  const fechaCreacion = esNota ? formatearFechaHora(aporte.creadoEn) : null
  const fechaEdicion =
    esNota && aporte.actualizadoEn !== aporte.creadoEn
      ? formatearFechaHora(aporte.actualizadoEn)
      : null
  return (
    <article className="flex gap-2 py-2 text-texto">
      <span
        aria-hidden="true"
        className="mt-2 size-1.5 shrink-0 rounded-full bg-miel"
      />
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-base font-semibold leading-relaxed">
          {aporte.titulo}
        </h3>
        {aporte.contenido && (
          <p
            className={`mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave ${resumen ? 'line-clamp-3' : ''}`}
          >
            {aporte.contenido}
          </p>
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
        {aporte.puedeEditar && alEditar && (
          <button
            type="button"
            onClick={alEditar}
            aria-label={`Editar ${esNota ? 'nota' : 'aporte'}: ${aporte.titulo}`}
            className="mt-2 inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Editar
          </button>
        )}
      </div>
    </article>
  )
}

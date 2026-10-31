import {
  ArrowsClockwise,
  CalendarBlank,
  Clock,
  FileImage,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react'
import { obtenerUrlDescargaArchivo } from '../../../api/archivos.js'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaCalendario } from '../../../utils/fechas.js'
import { nombreDiaSemana } from '../utils/recurrencia.js'

function formatearHora(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return ''
  return valor.trim().slice(0, 5)
}

export default function TarjetaEvento({
  proyectoId,
  evento,
  autorNombre,
  puedeModificar,
  eliminando,
  onEditar,
  onEliminar,
  onDescargarImagen,
}) {
  const fechaVisible = evento.fechaOcurrencia || evento.fecha
  const fechaFormateada =
    formatearFechaCalendario(fechaVisible) || fechaVisible
  const inicio = formatearHora(evento.horaInicio)
  const fin = formatearHora(evento.horaFin)
  const diaTexto = nombreDiaSemana(evento.diaSemana)

  return (
    <article className="rounded-lg border border-borde bg-superficie p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-display text-h2 text-secundario">
              {evento.titulo}
            </h3>
            {evento.recurrente && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-acento-suave px-2.5 py-0.5 text-xs font-semibold text-secundario">
                <ArrowsClockwise size={14} aria-hidden="true" />
                {diaTexto
                  ? `Cada ${diaTexto.toLowerCase()}`
                  : 'Se repite cada semana'}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-primario">
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank size={18} aria-hidden="true" />
              <time dateTime={fechaVisible}>{fechaFormateada}</time>
            </span>

            {(inicio || fin) && (
              <span className="inline-flex items-center gap-1.5 text-secundario">
                <Clock size={18} aria-hidden="true" />
                <span>
                  {inicio && fin ? `${inicio} a ${fin}` : inicio || fin}
                </span>
              </span>
            )}
          </div>

          {evento.descripcion && (
            <p className="mt-3 whitespace-pre-wrap break-words text-texto">
              {evento.descripcion}
            </p>
          )}

          {evento.imagenId && (
            <div className="mt-3">
              <a
                href={obtenerUrlDescargaArchivo(proyectoId, evento.imagenId)}
                download={`imagen-${evento.titulo}`}
                onClick={(e) => onDescargarImagen(e, evento)}
                className="inline-flex items-center gap-2 rounded-sm border border-borde bg-fondo px-3 py-1.5 text-sm font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
              >
                <FileImage
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-primario"
                />
                <span>Imagen del evento</span>
              </a>
            </div>
          )}

          {autorNombre && (
            <p className="mt-3 text-xs text-texto-suave">
              Cargado por: {autorNombre}
            </p>
          )}
        </div>

        {puedeModificar && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Boton
              variant="secondary"
              onClick={() => onEditar(evento)}
              aria-label={`Editar ${evento.titulo}`}
            >
              <PencilSimple size={16} aria-hidden="true" />
              Editar
            </Boton>
            <Boton
              variant="danger"
              onClick={() => onEliminar(evento)}
              disabled={eliminando}
              aria-label={`Eliminar ${evento.titulo}`}
            >
              <Trash size={16} aria-hidden="true" />
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </Boton>
          </div>
        )}
      </div>
    </article>
  )
}


import { formatearFechaHora } from '../../../utils/fechas.js'
import { ETIQUETAS_CONTEXTO, leerDatosAbc } from '../bitacora.js'

const BLOQUES = [
  ['antecedente', 'Antes'],
  ['conducta', 'Qué pasó'],
  ['consecuencia', 'Después'],
]

export default function TarjetaAbc({ registro, autorTexto }) {
  const info = leerDatosAbc(registro.datos)
  const fechaIso = info.fecha ?? registro.creadoEn
  const fechaTexto = formatearFechaHora(fechaIso)
  const contextoTexto =
    ETIQUETAS_CONTEXTO[info.contexto] ?? info.contexto ?? 'Sin contexto'

  return (
    <article id={`aporte-${registro.id}`} className="scroll-mt-6 rounded-lg border-l-4 border-agua bg-superficie p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-texto-suave">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-agua px-3 py-1 text-xs font-semibold text-superficie">
            Registro ABC
          </span>
          <p className="font-semibold text-secundario">
            <span>Autor: </span>
            <span>{autorTexto}</span>
          </p>
        </div>
        {fechaTexto ? (
          <time dateTime={fechaIso}>{fechaTexto}</time>
        ) : (
          <span>Fecha no disponible</span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {BLOQUES.map(([campo, titulo]) => (
          <div key={campo} className="rounded-md bg-fondo p-4">
            <dt className="text-sm font-semibold text-secundario">{titulo}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-texto">
              {info[campo] || '—'}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-secundario px-3 py-1 text-xs font-semibold text-superficie">
          {contextoTexto}
        </span>
      </div>
    </article>
  )
}


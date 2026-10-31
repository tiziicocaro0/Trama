import { FileImage, FilePdf, Lock } from '@phosphor-icons/react'
import {
  descargarArchivo,
  obtenerUrlDescargaArchivo,
} from '../../api/archivos.js'
import { formatearFechaCalendario, formatearFechaHora } from '../../utils/fechas.js'
import { etiquetaEspecialidad } from '../../features/perfil/especialidades.js'
import { leerDatosAporte, TIPOS_NOTA } from '../../features/perfil/perfil.js'
import ConfirmacionAporte from '../../features/perfil/components/ConfirmacionAporte.jsx'

const ETIQUETAS_TIPO_NOTA = Object.fromEntries(TIPOS_NOTA)

// 4.2: especialidades que declaró el autor en el proyecto, para mostrarlas a su lado
function obtenerEspecialidades(aporte) {
  if (!Array.isArray(aporte?.autorEspecialidades)) return null
  const nombres = aporte.autorEspecialidades
    .map((item) => etiquetaEspecialidad(item?.especialidad))
    .filter(Boolean)
  return nombres.length ? nombres.join(', ') : null
}

const contextosFortaleza = {
  CASA: 'Casa',
  ESCUELA: 'Escuela',
  CONSULTORIO: 'Consultorio',
  OTRO: 'Otro',
}

function leerFortaleza(aporte) {
  if (aporte.tipo !== 'FORTALEZA') return {}
  try {
    const datos = JSON.parse(aporte.datos ?? '{}')
    return {
      contexto: contextosFortaleza[datos?.contexto],
      ejemplo: typeof datos?.ejemplo === 'string' ? datos.ejemplo.trim() : '',
    }
  } catch {
    return {}
  }
}

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

function esArchivoPdf(archivo) {
  const mime = (archivo?.tipoMime ?? '').toLowerCase()
  const nombre = (archivo?.nombreOriginal ?? '').toLowerCase()
  return mime === 'application/pdf' || nombre.endsWith('.pdf')
}

export default function TarjetaAporte({
  aporte,
  autor,
  alEditar,
  alArchivar,
  alVerHistorial,
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
  const especialidades = obtenerEspecialidades(aporte)
  const datosNota = esNota ? leerDatosAporte(aporte.datos) : {}
  const tipoNota = ETIQUETAS_TIPO_NOTA[datosNota.tipoNota] ?? null
  const fechaNota = formatearFechaCalendario(datosNota.fecha)

  // 3.1: Identificar aportes con visibilidad restringida
  const esRestringido =
    aporte.visibilidad != null && aporte.visibilidad !== 'TODOS'

  const sustantivo = esNota ? 'nota' : 'aporte'
  const adjuntos = Array.isArray(aporte.archivos) ? aporte.archivos : []

  async function manejarClickAdjunto(evento, archivo) {
    if (!aporte.proyectoId) return
    evento.preventDefault()
    try {
      await descargarArchivo(
        aporte.proyectoId,
        archivo.id,
        archivo.nombreOriginal,
      )
    } catch {
      // Si falla la descarga programática, no interrumpe la vista
    }
  }

  // Editar y archivar: solo el autor. Ver historial (3.2): cualquier miembro que ve el aporte
  const puedeModificar = aporte.puedeEditar && (alEditar || alArchivar)

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

        {adjuntos.length > 0 && (
          <ul
            className="mt-2 flex flex-wrap gap-2"
            aria-label="Archivos adjuntos"
          >
            {adjuntos.map((archivo) => {
              const esPdf = esArchivoPdf(archivo)
              const Icono = esPdf ? FilePdf : FileImage
              const etiquetaTipo = esPdf ? 'PDF' : 'Imagen'
              const nombre = archivo.nombreOriginal || 'Archivo adjunto'
              return (
                <li key={archivo.id}>
                  <a
                    href={obtenerUrlDescargaArchivo(
                      aporte.proyectoId,
                      archivo.id,
                    )}
                    download={nombre}
                    onClick={(evento) => manejarClickAdjunto(evento, archivo)}
                    className="inline-flex items-center gap-2 rounded-sm border border-borde bg-superficie px-3 py-1.5 text-sm font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  >
                    <Icono
                      size={18}
                      role="img"
                      aria-label={`Ícono ${etiquetaTipo}`}
                      className="shrink-0 text-primario"
                    />
                    <span>{nombre}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        )}

        {(nombreAutor || (!esNota && fechaCreacion)) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-suave">
            {nombreAutor && (
              <span>
                {especialidades
                  ? `Cargado por: ${nombreAutor} · ${especialidades}`
                  : `Cargado por: ${nombreAutor}`}
              </span>
            )}
            {!esNota && fechaCreacion && (
              <time dateTime={fechaBase}>{fechaCreacion}</time>
            )}
          </div>
        )}

        {/* 3.3: confirmar el aporte de otra persona */}
        <ConfirmacionAporte aporte={aporte} />

        {esNota && (
          <div className="mt-3 space-y-1 text-sm text-texto-suave">
            {(tipoNota || fechaNota) && (
              <p className="font-semibold text-secundario">
                {[tipoNota, fechaNota && `Fecha: ${fechaNota}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
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

        {(puedeModificar || alVerHistorial) && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {puedeModificar && alEditar && (
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
            {puedeModificar && alArchivar && (
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
            {alVerHistorial && (
              <button
                type="button"
                onClick={alVerHistorial}
                aria-label={`Ver historial del ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center rounded-sm font-semibold text-secundario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                Ver historial
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

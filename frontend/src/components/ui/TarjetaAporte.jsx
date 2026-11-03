import { ChatCircle, Ear, FileImage, FilePdf, HandPointing, Hourglass, Image, Lock, UsersThree } from '@phosphor-icons/react'
import { useState } from 'react'
import {
  descargarArchivo,
  obtenerUrlDescargaArchivo,
  obtenerVistaArchivo,
} from '../../api/archivos.js'
import { Modal } from './Modal.jsx'
import { formatearFechaCalendario, formatearFechaHora } from '../../utils/fechas.js'
import { etiquetaEspecialidad } from '../../features/perfil/especialidades.js'
import {
  leerDatosAporte,
  leerFortaleza,
  TIPOS_NOTA,
} from '../../features/perfil/perfil.js'
import ConfirmacionAporte from '../../features/perfil/components/ConfirmacionAporte.jsx'
import DatosEstrategia from '../../features/perfil/components/DatosEstrategia.jsx'
import { CATEGORIAS_COMUNICACION, CATEGORIAS_SENSORIALES, CONTEXTOS_SENSORIALES, FORMAS_COMUNICACION, ICONOS_SENSORIALES, TONOS_SENSORIALES } from '../../features/perfil/camposAporte.js'

const ETIQUETAS_TIPO_NOTA = Object.fromEntries(TIPOS_NOTA)
const ICONOS_COMUNICACION = { EXPRESION: ChatCircle, COMPRENSION: Ear, NO_VERBAL: HandPointing, INTERACCION_SOCIAL: UsersThree, TIEMPO_ESPERA: Hourglass, APOYOS: Image }

// 4.2: especialidades que declaró el autor en el proyecto, para mostrarlas a su lado
function obtenerEspecialidades(aporte) {
  if (!Array.isArray(aporte?.autorEspecialidades)) return null
  const nombres = aporte.autorEspecialidades
    .map((item) => etiquetaEspecialidad(item?.especialidad))
    .filter(Boolean)
  return nombres.length ? nombres.join(', ') : null
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
  const [errorAdjunto, setErrorAdjunto] = useState('')
  const [vistaAdjunto, setVistaAdjunto] = useState(null)
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
  const fortaleza = leerFortaleza(aporte)
  const comunicacion = aporte.tipo === 'COMUNICACION' ? leerDatosAporte(aporte.datos) : null
  const sensorial = aporte.tipo === 'SENSORIAL' ? leerDatosAporte(aporte.datos) : null
  const estrategia = aporte.tipo === 'ESTRATEGIA' ? leerDatosAporte(aporte.datos) : null
  const categoriaSensorial = CATEGORIAS_SENSORIALES.find(([valor]) => valor === sensorial?.categoria)?.[1]
  const contextoSensorial = CONTEXTOS_SENSORIALES.find(([valor]) => valor === sensorial?.contexto)?.[1]
  const IconoSensorial = ICONOS_SENSORIALES[sensorial?.categoria]
  const categoriaComunicacion = CATEGORIAS_COMUNICACION.find(([valor]) => valor === comunicacion?.categoria)?.[1]
  const IconoComunicacion = ICONOS_COMUNICACION[comunicacion?.categoria]
  const formasComunicacion = Array.isArray(comunicacion?.formasComunicacion)
    ? comunicacion.formasComunicacion.map((forma) => forma === 'OTRA' ? comunicacion.otraForma : FORMAS_COMUNICACION.find(([valor]) => valor === forma)?.[1]).filter(Boolean)
    : []

  // 3.1: Identificar aportes con visibilidad restringida
  const esRestringido =
    aporte.visibilidad != null && aporte.visibilidad !== 'TODOS'

  const sustantivo = esNota ? 'nota' : 'aporte'
  const adjuntos = Array.isArray(aporte.archivos) ? aporte.archivos : []

  async function manejarClickAdjunto(evento, archivo) {
    if (!aporte.proyectoId) return
    evento.preventDefault()
    setErrorAdjunto('')
    try {
      if (['COMUNICACION', 'SENSORIAL', 'ESTRATEGIA'].includes(aporte.tipo) && !esArchivoPdf(archivo)) {
        const url = await obtenerVistaArchivo(aporte.proyectoId, archivo.id)
        setVistaAdjunto({ url, nombre: archivo.nombreOriginal || 'Pictograma' })
      } else {
        await descargarArchivo(aporte.proyectoId, archivo.id, archivo.nombreOriginal)
      }
    } catch (error) {
      setErrorAdjunto(error.message)
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
        {estrategia && <DatosEstrategia datos={estrategia} parte="categoria" />}
        {sensorial && <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-secundario">{IconoSensorial && <span className={`inline-flex size-10 items-center justify-center rounded-sm ${TONOS_SENSORIALES[sensorial.categoria]}`}><IconoSensorial size={24} aria-hidden="true" /></span>}{categoriaSensorial}{sensorial.lista === 'AYUDA' && <span className="rounded-full bg-secundario/10 px-2 py-1 text-secundario">Le ayuda</span>}{sensorial.lista === 'CUESTA' && <span className="rounded-full bg-primario/10 px-2 py-1 text-primario">Le cuesta</span>}</p>}
        {categoriaComunicacion && <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-secundario">{IconoComunicacion && <IconoComunicacion size={24} aria-hidden="true" className="text-agua" />}{categoriaComunicacion}</p>}
        <h3 className={`flex items-center gap-2 break-words leading-relaxed ${comunicacion ? 'font-display text-subtitulo' : 'text-base font-semibold'}`}>
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
        {estrategia && <DatosEstrategia datos={estrategia} />}
        {contextoSensorial && <p className="mt-1 text-sm text-texto-suave">Lugar o contexto: {contextoSensorial}</p>}
        {(sensorial || estrategia) && esRestringido && <p className="mt-2 text-xs font-semibold text-secundario">{aporte.visibilidad === 'PROFESIONALES' ? 'Solo equipo profesional' : aporte.visibilidad === 'SOLO_TUTORES' ? 'Solo tutores' : 'Visibilidad restringida'}</p>}

        {/* 2.2: dónde lo hace y un ejemplo concreto */}
        {fortaleza.contexto && (
          <p className="mt-1 text-sm text-texto-suave">
            Contexto: {fortaleza.contexto}
          </p>
        )}
        {fortaleza.ejemplo && (
          <p
            className={`mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave ${resumen ? 'line-clamp-2' : ''}`}
          >
            Ejemplo: {fortaleza.ejemplo}
          </p>
        )}
        {formasComunicacion.length > 0 && <p className="mt-2 text-sm"><strong>Cómo se comunica:</strong> {formasComunicacion.join(', ')}</p>}
        {comunicacion?.comoHablarle && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>Cómo conviene hablarle:</strong> {comunicacion.comoHablarle}</p>}
        {comunicacion?.queEvitar && <p className="mt-2 whitespace-pre-wrap break-words text-sm"><strong>Qué evitar:</strong> {comunicacion.queEvitar}</p>}

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
                    <span>{nombre}{(sensorial || estrategia) && <span className="ml-2 font-normal text-texto-suave">{archivo.tipoMime || 'Archivo'}{Number.isFinite(archivo.tamanoBytes) ? ` · ${(archivo.tamanoBytes / 1048576).toFixed(1)} MB` : ''}</span>}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
        {errorAdjunto && <p role="alert" className="mt-2 text-sm text-error">{errorAdjunto}</p>}
        {vistaAdjunto && <Modal abierto titulo={vistaAdjunto.nombre} onCerrar={() => { window.URL.revokeObjectURL(vistaAdjunto.url); setVistaAdjunto(null) }}><img src={vistaAdjunto.url} alt={vistaAdjunto.nombre} className="max-h-96 w-full object-contain" /></Modal>}

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

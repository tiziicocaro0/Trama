import { ChatCircle, Ear, FileImage, FilePdf, HandPointing, Hourglass, PencilSimple, Archive, ClockCounterClockwise, Image, Lock, SquaresFour, UsersThree, HandPalm } from '@phosphor-icons/react'
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
import RevisionAporte from '../../features/perfil/components/RevisionAporte.jsx'
import ComentariosAporte from '../../features/perfil/components/ComentariosAporte.jsx'
import ConfirmacionAporte from '../../features/perfil/components/ConfirmacionAporte.jsx'
import DatosEstrategia from '../../features/perfil/components/DatosEstrategia.jsx'
import { CATEGORIAS_COMUNICACION, CATEGORIAS_SENSORIALES, CONTEXTOS_SENSORIALES, FORMAS_COMUNICACION, ICONOS_SENSORIALES, TONOS_SENSORIALES, ICONOS_LISTA_SENSORIAL, TONOS_LISTA_SENSORIAL, CONTEXTOS_RUTINA, ICONOS_RUTINA, TONOS_RUTINA, etiquetaCategoriaRutina, ICONOS_DESREGULACION, TONOS_DESREGULACION, } from '../../features/perfil/camposAporte.js'

const ETIQUETAS_TIPO_NOTA = Object.fromEntries(TIPOS_NOTA)
const ICONOS_COMUNICACION = { EXPRESION: ChatCircle, COMPRENSION: Ear, NO_VERBAL: HandPointing, INTERACCION_SOCIAL: UsersThree, TIEMPO_ESPERA: Hourglass, APOYOS: Image }

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
  esTutor = false,
  usuarioId,
  alActualizarRevision,
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
  const datosNota = esNota ? leerDatosAporte(aporte.datos) : {}
  const tipoNota = ETIQUETAS_TIPO_NOTA[datosNota.tipoNota] ?? null
  const fechaNota = formatearFechaCalendario(datosNota.fecha)
  const fortaleza = leerFortaleza(aporte)
  const comunicacion = aporte.tipo === 'COMUNICACION' ? leerDatosAporte(aporte.datos) : null
  const sensorial = aporte.tipo === 'SENSORIAL' ? leerDatosAporte(aporte.datos) : null
  const estrategia = aporte.tipo === 'ESTRATEGIA' ? leerDatosAporte(aporte.datos) : null
  const rutina = aporte.tipo === 'RUTINA' ? leerDatosAporte(aporte.datos) : null
  const desregulacion = aporte.tipo === 'DESREGULACION' ? leerDatosAporte(aporte.datos) : null
  const contextoSensorial = CONTEXTOS_SENSORIALES.find(([valor]) => valor === sensorial?.contexto)?.[1]
  const IconoSensorial = ICONOS_SENSORIALES[sensorial?.categoria]
  const IconoListaSensorial = sensorial ? ICONOS_LISTA_SENSORIAL[sensorial.lista] : null
  const etiquetaListaSensorial = sensorial?.lista === 'AYUDA' ? 'Le ayuda' : sensorial?.lista === 'CUESTA' ? 'Le cuesta' : null
  const IconoComunicacion = ICONOS_COMUNICACION[comunicacion?.categoria]
  const formasComunicacion = Array.isArray(comunicacion?.formasComunicacion)
    ? comunicacion.formasComunicacion.map((forma) => forma === 'OTRA' ? comunicacion.otraForma : FORMAS_COMUNICACION.find(([valor]) => valor === forma)?.[1]).filter(Boolean)
    : []
  const categoriaRutina = rutina ? etiquetaCategoriaRutina(rutina) : ''
  const IconoRutina = ICONOS_RUTINA[rutina?.categoria] ?? (rutina?.categoria === 'PERSONALIZADA' ? SquaresFour : null)
  const contextosRutina = Array.isArray(rutina?.contextos) ? rutina.contextos.map((valor) => CONTEXTOS_RUTINA.find(([codigo]) => codigo === valor)?.[1]).filter(Boolean) : []
  const IconoDesregulacion = ICONOS_DESREGULACION[desregulacion?.lista]

  const IconoPrincipal =
  IconoDesregulacion ??
  IconoComunicacion ??
  IconoSensorial ??
  IconoRutina ??
  null

  const tonoPrincipal = desregulacion
  ? TONOS_DESREGULACION[desregulacion.lista]
  : sensorial
    ? TONOS_SENSORIALES[sensorial.categoria]
    : rutina
      ? TONOS_RUTINA[rutina.categoria]
      : comunicacion
        ? 'bg-agua/20 text-agua'
        : 'bg-secundario/15 text-secundario'


  const inicialesAutor = nombreAutor
  ? nombreAutor
      .split(' ')
      .map((parte) => parte[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  : ''

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
      if (['COMUNICACION', 'SENSORIAL', 'ESTRATEGIA', 'RUTINA'].includes(aporte.tipo) && !esArchivoPdf(archivo)) {
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

  const especialidadAutor =
  aporte.autorEspecialidades?.[0]?.especialidad
    ? etiquetaEspecialidad(aporte.autorEspecialidades[0].especialidad)
    : null

  return (
    <article className="flex gap-2 py-2 text-texto">
      <div className="min-w-0 flex-1">
        {estrategia && <DatosEstrategia datos={estrategia} parte="categoria" />}
        {rutina && categoriaRutina && <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-secundario"><span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-sm ${TONOS_RUTINA[rutina.categoria] ?? 'bg-secundario/15 text-secundario'}`}>{IconoRutina && <IconoRutina size={24} aria-hidden="true" />}</span>{categoriaRutina}</p>}
        {estrategia && <DatosEstrategia datos={estrategia} />}
        {contextosRutina.length > 0 && <p className="mt-1 text-sm text-texto-suave">Dónde suele ocurrir: {contextosRutina.join(', ')}</p>}
        {(sensorial || estrategia || rutina) && esRestringido && <p className="mt-2 text-xs font-semibold text-secundario">{aporte.visibilidad === 'PROFESIONALES' ? 'Solo equipo profesional' : aporte.visibilidad === 'SOLO_TUTORES' ? 'Solo tutores' : aporte.visibilidad === 'SOLO_SALUD' ? 'Salud y tutores' : aporte.visibilidad === 'SOLO_EDUCACION' ? 'Educación y tutores' : 'Visibilidad restringida'}</p>}

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
                    <span>{nombre}{(sensorial || estrategia || rutina) && <span className="ml-2 font-normal text-texto-suave">{archivo.tipoMime || 'Archivo'}{Number.isFinite(archivo.tamanoBytes) ? ` · ${(archivo.tamanoBytes / 1048576).toFixed(1)} MB` : ''}</span>}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
        {errorAdjunto && <p role="alert" className="mt-2 text-sm text-error">{errorAdjunto}</p>}
        {vistaAdjunto && <Modal abierto titulo={vistaAdjunto.nombre} onCerrar={() => { window.URL.revokeObjectURL(vistaAdjunto.url); setVistaAdjunto(null) }}><img src={vistaAdjunto.url} alt={vistaAdjunto.nombre} className="max-h-96 w-full object-contain" /></Modal>}

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {IconoPrincipal && (
              <span
                className={`flex size-14 shrink-0 items-center justify-center rounded-md ${tonoPrincipal}`}
              >
                <IconoPrincipal size={28} aria-hidden="true" />
              </span>
            )}

            <h3 className="font-display text-subtitulo leading-tight text-texto">
              {aporte.titulo}
            </h3>
            {esRestringido && (
              <Lock
                size={18}
                role="img"
                aria-label="Visibilidad restringida"
                className="shrink-0 text-texto-suave"
              />
            )}
              {sensorial && !resumen && etiquetaListaSensorial && IconoListaSensorial && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
                    TONOS_LISTA_SENSORIAL[sensorial.lista]
                  }`}
                >
                  <IconoListaSensorial size={16} aria-hidden="true" />
                  {etiquetaListaSensorial}
                </span>
              )}
          </div>

          {aporte.contenido && (
            <p
              className={`text-base leading-relaxed text-texto-suave ${
                resumen ? 'line-clamp-3' : ''
              }`}
            >
              {aporte.contenido}
            </p>
          )}

          {contextoSensorial && <p className="mt-1 text-sm text-texto-suave">Lugar o contexto: {contextoSensorial}</p>}


          {comunicacion && !resumen && (
            <div className="space-y-3">
              {formasComunicacion.length > 0 && (
                <div className="rounded-md border border-agua/20 bg-agua/10 p-4">
                  <div className="flex items-center gap-2">
                    <Image size={18} aria-hidden="true" className="text-agua" />
                    <p className="text-sm font-semibold text-secundario">
                      Cómo se comunica
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-texto-suave">
                    {formasComunicacion.join(', ')}
                  </p>
                </div>
              )}

              {comunicacion.comoHablarle && (
                <div className="rounded-md border border-secundario/20 bg-secundario/10 p-4">
                  <div className="flex items-center gap-2">
                    <ChatCircle
                      size={18}
                      aria-hidden="true"
                      className="text-secundario"
                    />
                    <p className="text-sm font-semibold text-secundario">
                      Cómo conviene hablarle
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-texto-suave">
                    {comunicacion.comoHablarle}
                  </p>
                </div>
              )}

              {comunicacion.queEvitar && (
                <div className="rounded-md border border-primario/20 bg-primario/10 p-4">
                  <div className="flex items-center gap-2">
                    <HandPalm
                      size={18}
                      aria-hidden="true"
                      className="text-primario"
                    />
                    <p className="text-sm font-semibold text-primario">
                      Qué evitar
                    </p>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-texto-suave">
                    {comunicacion.queEvitar}
                  </p>
                </div>
              )}
            </div>
          )}

          {(nombreAutor || (!esNota && fechaCreacion)) && (
            <div className="flex items-center gap-3">
              {nombreAutor && (
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-decoracion font-semibold text-secundario"
                >
                  {inicialesAutor}
                </span>
              )}

              <div className="text-sm text-texto-suave">
                {nombreAutor && (
                  <p className="font-semibold text-texto">
                    {especialidadAutor
                      ? `Cargado por: ${nombreAutor} · ${especialidadAutor}`
                      : `Cargado por: ${nombreAutor}`}
                  </p>
                )}

                {!esNota && fechaCreacion && (
                  <time dateTime={fechaBase}>
                    {fechaCreacion}
                  </time>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3.3: confirmar el aporte de otra persona */}
        {!resumen && (
          <ConfirmacionAporte aporte={aporte} />
        )}
        <RevisionAporte aporte={aporte} esTutor={esTutor} usuarioId={usuarioId} alActualizar={alActualizarRevision} />
        <ComentariosAporte aporte={aporte} usuarioId={usuarioId} />

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

        {!resumen && (puedeModificar || alVerHistorial) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {puedeModificar && alEditar && (
              <button
                type="button"
                onClick={alEditar}
                disabled={archivando}
                aria-label={`Editar ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-secundario px-4 text-sm font-semibold text-secundario transition hover:bg-secundario/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secundario"
              >
                <PencilSimple size={16} aria-hidden="true" />
                Editar
              </button>
            )}

            {puedeModificar && alArchivar && (
              <button
                type="button"
                onClick={alArchivar}
                disabled={archivando}
                aria-label={`Archivar ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-miel px-4 text-sm font-semibold text-miel transition hover:bg-miel/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miel"
              >
                <Archive size={16} aria-hidden="true" />
                {archivando ? 'Archivando…' : 'Archivar'}
              </button>
            )}

            {alVerHistorial && (
              <button
                type="button"
                onClick={alVerHistorial}
                aria-label={`Ver historial del ${sustantivo}: ${aporte.titulo}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-borde px-4 text-sm font-semibold text-texto-suave transition hover:bg-fondo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
              >
                <ClockCounterClockwise size={16} aria-hidden="true" />
                Ver historial
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

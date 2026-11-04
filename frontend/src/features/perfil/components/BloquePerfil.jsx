import {
  ArrowRight,
  CalendarBlank,
  ChatCircle,
  Ear,
  Lightbulb,
  NotePencil,
  Palette,
  Star,
  Plus,
  X,
} from '@phosphor-icons/react'
import { Fragment, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { archivarAporte } from '../../../api/aportes.js'
import Boton from '../../../components/ui/Boton.jsx'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import EditorAporte from './EditorAporte.jsx'
import HistorialAporte from './HistorialAporte.jsx'
import { leerDatosAporte } from '../perfil.js'

const iconos = {
  FORTALEZA: Star,
  INTERES: Palette,
  COMUNICACION: ChatCircle,
  SENSORIAL: Ear,
  ESTRATEGIA: Lightbulb,
  RUTINA: CalendarBlank,
  NOTA_PROFESIONAL: NotePencil,
}

export default function BloquePerfil({
  seccion,
  aportes,
  proyectoId,
  completo = false,
  puedeCrear = false,
  alGuardar,
  encabezado,
}) {
  const [editor, setEditor] = useState(null)
  const [archivandoId, setArchivandoId] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  // 3.2: aporte cuyo historial está abierto
  const [historialDe, setHistorialDe] = useState(null)
  const disparador = useRef(null)

  function abrirEditor(event, aporte = {}) {
    disparador.current = event.currentTarget
    setErrorArchivo('')
    setEditor(aporte)
  }

  function cancelar() {
    setEditor(null)
    disparador.current?.focus()
  }

  function abrirDesdeEncabezado() {
    setErrorArchivo('')
    setEditor({})
  }

  async function archivar(aporte) {
    if (archivandoId) return
    setArchivandoId(aporte.id)
    setErrorArchivo('')
    try {
      await archivarAporte(proyectoId, aporte.id)
      alGuardar?.('archivado')
    } catch (error) {
      setErrorArchivo(error.message)
    } finally {
      setArchivandoId(null)
    }
  }

  const Icon = iconos[seccion.tipo]
  const esNota = seccion.tipo === 'NOTA_PROFESIONAL'
  const esComunicacion = seccion.tipo === 'COMUNICACION' && completo
  const esSensorial = seccion.tipo === 'SENSORIAL' && completo
  const esEstrategia = seccion.tipo === 'ESTRATEGIA' && completo
  const esRutina = seccion.tipo === 'RUTINA' && completo
  const esPanel = esComunicacion || esSensorial || esEstrategia || esRutina
  const visibles = completo ? aportes : aportes.slice(0, 3)
  const agrupados = esSensorial
    ? ['AYUDA', 'CUESTA', ''].flatMap((lista) => visibles.filter((aporte) => (leerDatosAporte(aporte.datos).lista || '') === lista))
    : visibles

  return (
    <section
      aria-labelledby={`titulo-${seccion.slug}`}
      className={esPanel ? 'flex min-w-0 flex-col' : 'flex min-w-0 flex-col rounded-lg bg-superficie p-5 shadow-sm sm:p-6'}
    >
      <div className={esSensorial || esEstrategia || esRutina ? 'sr-only' : 'mb-3 flex items-center gap-3'}>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${seccion.tono}`}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
        <h2
          id={`titulo-${seccion.slug}`}
          className="font-display text-h2 text-secundario"
        >
          {seccion.titulo}
        </h2>
      </div>
      {encabezado?.(abrirDesdeEncabezado)}
      {errorArchivo && (
        <p role="alert" className="mb-3 text-sm text-error">
          {errorArchivo}
        </p>
      )}
      {visibles.length ? (
        <ul className={esPanel ? 'mb-4 grid flex-1 grid-cols-1 gap-4 md:grid-cols-2' : 'mb-4 flex-1 divide-y divide-borde/40'}>
          {agrupados.map((aporte, indice) => (
            <Fragment key={aporte.id}>
            {esSensorial && (indice === 0 || leerDatosAporte(agrupados[indice - 1].datos).lista !== leerDatosAporte(aporte.datos).lista) && <li className="col-span-full"><h3 className="font-display text-h2 text-secundario">{leerDatosAporte(aporte.datos).lista === 'AYUDA' ? 'Le ayuda' : leerDatosAporte(aporte.datos).lista === 'CUESTA' ? 'Le cuesta' : 'Sin clasificar'}</h3></li>}
            <li className={esPanel ? 'rounded-lg bg-superficie p-5 shadow-sm' : ''}>
              <TarjetaAporte
                aporte={aporte}
                resumen={!completo}
                archivando={archivandoId === aporte.id}
                alEditar={(event) => abrirEditor(event, aporte)}
                alArchivar={() => archivar(aporte)}
                alVerHistorial={(event) => {
                  disparador.current = event.currentTarget
                  setHistorialDe(aporte)
                }}
              />
            </li>
            </Fragment>
          ))}
        </ul>
      ) : (
        <div className="mb-4 flex-1 py-3 text-texto-suave">
          <p>
            {puedeCrear
              ? esNota
                ? 'Todavía no hay notas. ¡Escribí la primera!'
                : 'Todavía no hay aportes. ¡Sumá el primero!'
              : esNota
                ? 'Todavía no hay notas visibles para vos.'
                : 'Todavía no hay aportes visibles para vos.'}
          </p>
        </div>
      )}
      {puedeCrear && !editor && !esRutina && (
        <Boton variant={esPanel ? 'primary' : 'secondary'} onClick={abrirEditor} className={esPanel ? 'fixed bottom-20 right-4 z-30 shadow-md md:static md:mb-4 md:self-end' : 'mb-4'}>
          {esNota ? 'Agregar nota' : 'Agregar aporte'}
        </Boton>
      )}
      {puedeCrear && !editor && esRutina && <button type="button" onClick={abrirEditor} className="fixed bottom-20 right-4 z-30 inline-flex min-h-14 items-center gap-2 rounded-full bg-primario px-5 font-semibold text-superficie shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario md:hidden"><Plus size={20} aria-hidden="true" /><span>Agregar aporte</span></button>}
      {historialDe && (
        <HistorialAporte
          key={historialDe.id}
          proyectoId={proyectoId}
          aporte={historialDe}
          onCerrar={() => {
            setHistorialDe(null)
            disparador.current?.focus()
          }}
        />
      )}
      {editor && (
        <div className={esPanel ? 'fixed inset-0 z-60 flex justify-end bg-texto/40' : ''}>
          <div
            role={esPanel ? 'dialog' : undefined}
            aria-modal={esPanel ? 'true' : undefined}
            aria-labelledby={esPanel ? 'titulo-panel-aporte' : undefined}
            className={esPanel ? 'h-full w-full overflow-y-auto bg-superficie p-4 shadow-md sm:max-w-xl' : ''}
          >
            {esPanel && (
              <div className="flex items-center justify-between border-b border-borde pb-3">
                <h2 id="titulo-panel-aporte" className="font-display text-h2 text-secundario">
                  {editor.id ? 'Editar aporte' : 'Agregar aporte'}
                </h2>
                <button type="button" onClick={cancelar} aria-label="Cerrar panel de aporte" className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-primario focus-visible:outline-2 focus-visible:outline-primario">
                  <X size={24} aria-hidden="true" />
                </button>
              </div>
            )}
            <EditorAporte
              key={editor.id ?? 'nuevo'}
              seccion={seccion}
              proyectoId={proyectoId}
              aporte={editor.id ? editor : null}
              alCancelar={cancelar}
              alGuardar={() => {
                setEditor(null)
                alGuardar?.('guardado')
              }}
            />
          </div>
        </div>
      )}
      {!completo && (
        <Link
          to={`/proyectos/${proyectoId}/${seccion.slug}`}
          aria-label={`Ver todo: ${seccion.titulo}`}
          className="mt-auto flex min-h-11 items-center justify-between gap-3 rounded-sm font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          Ver todo <ArrowRight size={20} aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}

import {
  ArrowRight,
  CalendarBlank,
  ChatCircle,
  Ear,
  Lightbulb,
  NotePencil,
  Palette,
  Star,
} from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { archivarAporte } from '../../../api/aportes.js'
import Boton from '../../../components/ui/Boton.jsx'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import EditorAporte from './EditorAporte.jsx'

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
  miembros = [],
  proyectoId,
  completo = false,
  puedeCrear = false,
  alGuardar,
}) {
  const [editor, setEditor] = useState(null)
  const [archivandoId, setArchivandoId] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState('')
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
  const visibles = completo ? aportes : aportes.slice(0, 3)

  return (
    <section
      aria-labelledby={`titulo-${seccion.slug}`}
      className="flex min-w-0 flex-col rounded-lg bg-superficie p-5 shadow-sm sm:p-6"
    >
      <div className="mb-3 flex items-center gap-3">
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
      {errorArchivo && (
        <p role="alert" className="mb-3 text-sm text-error">
          {errorArchivo}
        </p>
      )}
      {visibles.length ? (
        <ul className="mb-4 flex-1 divide-y divide-borde/40">
          {visibles.map((aporte) => {
            const miembroAutor = miembros.find(
              (miembro) => miembro.usuarioId === aporte.autorId,
            )

            

            const nombreAutor = miembroAutor
              ? [miembroAutor.nombre, miembroAutor.apellido]
                  .filter(Boolean)
                  .join(' ')
              : null

            return (
              <li key={aporte.id}>
                <TarjetaAporte
                  aporte={aporte}
                  autor={nombreAutor}
                  resumen={!completo}
                  archivando={archivandoId === aporte.id}
                  alEditar={(event) => abrirEditor(event, aporte)}
                  alArchivar={() => archivar(aporte)}
                />
              </li>
            )
          })}
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
      {puedeCrear && !editor && (
        <Boton variant="secondary" onClick={abrirEditor} className="mb-4">
          {esNota ? 'Agregar nota' : 'Agregar aporte'}
        </Boton>
      )}
      {editor && (
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

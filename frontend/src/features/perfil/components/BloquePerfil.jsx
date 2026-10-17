import {
  ArrowRight,
  CalendarBlank,
  ChatCircle,
  Ear,
  Lightbulb,
  Palette,
  Star,
  NotePencil,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import { useRef, useState } from 'react'
import Button from '../../../components/ui/Button.jsx'
import EditorAporte from './EditorAporte.jsx'

const iconos = {
  FORTALEZA: Star,
  INTERES: Palette,
  COMUNICACION: ChatCircle,
  SENSORIAL: Ear,
  ESTRATEGIA: Lightbulb,
  RUTINA: CalendarBlank,
  NOTA: NotePencil,
}

export default function BloquePerfil({
  seccion,
  aportes,
  proyectoId,
  completo = false,
  puedeCrear = false,
  alGuardar,
}) {
  const [editor, setEditor] = useState(null)
  const disparador = useRef(null)
  function abrirEditor(event, aporte = {}) {
    disparador.current = event.currentTarget
    setEditor(aporte)
  }
  function cancelar() {
    setEditor(null)
    disparador.current?.focus()
  }
  const Icon = iconos[seccion.tipo]
  const esNota = seccion.tipo === 'NOTA'
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
      {visibles.length ? (
        <ul className="mb-4 flex-1 divide-y divide-borde/40">
          {visibles.map((aporte) => (
            <li key={aporte.id}>
              <TarjetaAporte
                aporte={aporte}
                resumen={!completo}
                alEditar={(event) => abrirEditor(event, aporte)}
              />
            </li>
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
      {puedeCrear && !editor && (
        <Button variant="secondary" onClick={abrirEditor} className="mb-4">
          {esNota ? 'Agregar nota' : 'Agregar aporte'}
        </Button>
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
            alGuardar()
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

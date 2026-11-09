import { Lightbulb } from '@phosphor-icons/react'
import { PREGUNTAS_GUIA } from '../../utils/preguntasGuia.js'

export default function PreguntaGuia({ tipo }) {
  const guia = PREGUNTAS_GUIA[tipo]

  if (!guia) return null

  return (
    <aside className="rounded-md border border-miel/30 bg-miel/10 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-miel/20 text-miel"
        >
          <Lightbulb size={20} />
        </span>

        <div>
          <p className="font-semibold text-secundario">
            {guia.pregunta}
          </p>

          <p className="mt-1 text-sm text-texto-suave">
            {guia.ejemplo}
          </p>
        </div>
      </div>
    </aside>
  )
}
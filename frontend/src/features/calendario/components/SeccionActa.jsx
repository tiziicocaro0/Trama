import { FileText, PencilSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'

export default function SeccionActa({
  evento,
  puedeEditarActa,
  onGuardarActa,
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(evento.acta || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function manejarGuardar(e) {
    e.preventDefault()
    if (!texto.trim()) {
      setError('Escribí el contenido del acta.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await onGuardarActa(evento, texto.trim())
      setEditando(false)
    } catch (err) {
      setError(err?.message || 'No pudimos guardar el acta. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mt-4 rounded-md border border-borde bg-fondo p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 font-semibold text-secundario">
          <FileText size={18} aria-hidden="true" />
          Acta de la reunión
        </h4>

        {puedeEditarActa && !editando && (
          <Boton
            variant="secondary"
            onClick={() => {
              setTexto(evento.acta || '')
              setError('')
              setEditando(true)
            }}
          >
            <PencilSimple size={16} aria-hidden="true" />
            {evento.acta ? 'Editar acta' : 'Registrar acta'}
          </Boton>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      {editando ? (
        <form onSubmit={manejarGuardar} className="mt-3 space-y-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            maxLength={20000}
            disabled={guardando}
            placeholder="Registrá los acuerdos, temas tratados y conclusiones de la reunión…"
            aria-label="Contenido del acta"
            className="w-full rounded-md border border-borde bg-superficie p-3 text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Boton
              type="button"
              variant="secondary"
              onClick={() => {
                setEditando(false)
                setTexto(evento.acta || '')
                setError('')
              }}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar acta'}
            </Boton>
          </div>
        </form>
      ) : evento.acta ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-texto">
          {evento.acta}
        </p>
      ) : (
        <p className="mt-2 text-xs text-texto-suave">
          {puedeEditarActa
            ? 'Todavía no se registró el acta de esta reunión. Podés escribirla haciendo clic en "Registrar acta".'
            : 'Todavía no se registró el acta de esta reunión.'}
        </p>
      )}
    </div>
  )
}


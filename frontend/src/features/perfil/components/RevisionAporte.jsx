import { ArrowCounterClockwise, CheckCircle } from '@phosphor-icons/react'
import { useContext, useState } from 'react'
import { marcarRevisada, obtenerRevision, pedirRevision } from '../../../api/revisiones.js'
import { avisar } from '../../../components/avisos/avisosFlotantes.js'
import Boton from '../../../components/ui/Boton.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import AuthContext from '../../auth/AuthContext.js'

const MAXIMO_MOTIVO = 1000

// 3.4: el aporte muestra "Revisión pendiente". Su autor puede ver el motivo y marcarla como revisada.
export function RevisionPendiente({ aporte, alCambiar }) {
  const usuario = useContext(AuthContext)?.usuario ?? null
  const esAutor = Boolean(usuario?.id) && usuario.id === aporte.autorId
  const [abierta, setAbierta] = useState(false)
  const [motivo, setMotivo] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!aporte.revisionPendiente) return null

  const chip = (
    <>
      <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
      Revisión pendiente
    </>
  )
  const claseChip =
    'inline-flex items-center gap-1.5 rounded-full bg-miel/15 px-2.5 py-1 text-xs font-semibold text-secundario'

  if (!esAutor || !aporte.revisionPendienteId) {
    return <p className="mb-2"><span className={claseChip}>{chip}</span></p>
  }

  async function alternar() {
    const abrir = !abierta
    setAbierta(abrir)
    if (!abrir || motivo !== null) return
    setError('')
    try {
      const revision = await obtenerRevision(aporte.proyectoId, aporte.revisionPendienteId)
      setMotivo(revision.motivo ?? '')
    } catch (err) {
      setError(err.message)
    }
  }

  async function marcar() {
    setEnviando(true)
    setError('')
    try {
      await marcarRevisada(aporte.proyectoId, aporte.revisionPendienteId)
      avisar('Listo. Marcaste la revisión como hecha.')
      await alCambiar?.()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierta}
        className={`${claseChip} transition-colors hover:bg-miel/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none`}
      >
        {chip} · {abierta ? 'Ocultar motivo' : 'Ver motivo'}
      </button>
      {abierta && (
        <div className="mt-2 rounded-md border border-miel/40 bg-miel/10 p-3 text-sm">
          <p className="font-semibold text-secundario">Te pidieron revisar este aporte</p>
          {motivo === null && !error && <p className="mt-1 text-texto-suave">Cargando el motivo…</p>}
          {motivo && <p className="mt-1 whitespace-pre-wrap break-words text-texto">{motivo}</p>}
          {error && <p role="alert" className="mt-1 text-error">{error}</p>}
          <p className="mt-2 text-texto-suave">Podés editarlo si hace falta y después marcarlo como revisado.</p>
          <Boton variant="secondary" onClick={marcar} disabled={enviando} className="mt-3">
            <CheckCircle size={18} aria-hidden="true" />
            {enviando ? 'Guardando…' : 'Marcar como revisada'}
          </Boton>
        </div>
      )}
    </div>
  )
}

// 3.4: un tutor pide revisar el aporte de otra persona, indicando el motivo
export function ModalPedirRevision({ aporte, abierto, onCerrar, alCambiar }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    if (!motivo.trim()) {
      setError('Contá por qué hay que revisarlo.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await pedirRevision(aporte.proyectoId, aporte.id, motivo)
      avisar('Listo. Le avisamos a quien lo cargó.')
      setMotivo('')
      onCerrar()
      await alCambiar?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto={abierto} titulo="Pedir revisión" onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <p className="text-texto-suave">
          Le avisamos a quien cargó «{aporte.titulo}». El aporte no cambia: decide su autor.
        </p>
        <div>
          <label htmlFor={`motivo-${aporte.id}`} className="mb-1 block font-semibold text-texto">
            ¿Qué habría que revisar?
          </label>
          <textarea
            id={`motivo-${aporte.id}`}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={MAXIMO_MOTIVO}
            rows={4}
            aria-invalid={Boolean(error)}
            aria-describedby={`motivo-ayuda-${aporte.id}`}
            className="w-full rounded-md border border-borde bg-superficie p-3 text-texto focus-visible:outline-2 focus-visible:outline-primario"
          />
          <p id={`motivo-ayuda-${aporte.id}`} className="mt-1 text-xs text-texto-suave">
            {motivo.length}/{MAXIMO_MOTIVO}
          </p>
          {error && <p role="alert" className="mt-1 text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Boton type="button" variant="secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Pedir revisión'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

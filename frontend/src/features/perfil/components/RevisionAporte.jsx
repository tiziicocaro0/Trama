import { useEffect, useRef, useState } from 'react'
import { marcarRevision, obtenerRevision, solicitarRevision } from '../../../api/revisiones.js'
import Boton from '../../../components/ui/Boton.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'

export default function RevisionAporte({ aporte, esTutor, usuarioId, alActualizar }) {
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [enviando, setEnviando] = useState(false)
  const ocupado = useRef(false)
  const disparador = useRef(null)
  const esAutor = Boolean(usuarioId && aporte.autorId === usuarioId)
  const pendiente = aporte.revisionPendiente === true
  const revisionId = aporte.revisionPendienteId
  const puedePedir = esTutor && Boolean(usuarioId && aporte.autorId && aporte.proyectoId && aporte.id) && !esAutor && !aporte.archivado && aporte.revisionPendiente === false

  useEffect(() => {
    if (!esAutor || !pendiente || !revisionId || !aporte.proyectoId) return undefined
    const controlador = new AbortController()
    obtenerRevision(aporte.proyectoId, revisionId, controlador.signal).then(
      (revision) => { if (!controlador.signal.aborted) setDetalle(revision) },
      (err) => { if (!controlador.signal.aborted) setErrorDetalle(err.message) },
    )
    return () => controlador.abort()
  }, [esAutor, pendiente, revisionId, aporte.proyectoId])

  function cerrar() {
    if (ocupado.current) return
    setAbierto(false)
    setError('')
    disparador.current?.focus()
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado.current) return
    if (!motivo.trim()) { setError('Ingresá el motivo de la revisión.'); return }
    ocupado.current = true
    setEnviando(true)
    setError('')
    try {
      await solicitarRevision(aporte.proyectoId, aporte.id, motivo.trim())
      setAbierto(false)
      setMotivo('')
      alActualizar?.()
    } catch (err) { setError(err.message) }
    finally { ocupado.current = false; setEnviando(false) }
  }

  async function marcar() {
    if (ocupado.current || !revisionId) return
    ocupado.current = true
    setEnviando(true)
    setError('')
    try {
      await marcarRevision(aporte.proyectoId, revisionId)
      alActualizar?.()
    } catch (err) { setError(err.message) }
    finally { ocupado.current = false; setEnviando(false) }
  }

  if (!pendiente && !puedePedir) return null
  return (
    <div className="mt-2 space-y-2">
      {pendiente && <p className="text-sm font-semibold text-secundario">Revisión pendiente</p>}
      {esAutor && pendiente && detalle?.id === revisionId && detalle.estado === 'PENDIENTE' && <p className="whitespace-pre-wrap break-words text-sm text-texto">Motivo: {detalle.motivo}</p>}
      {esAutor && pendiente && errorDetalle && <p role="alert" className="text-sm text-error">{errorDetalle}</p>}
      {esAutor && pendiente && revisionId && <button type="button" onClick={marcar} disabled={enviando} className="min-h-11 rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primario disabled:opacity-50">{enviando ? 'Guardando…' : 'Marcar como revisado'}</button>}
      {puedePedir && <button ref={disparador} type="button" onClick={() => setAbierto(true)} className="min-h-11 rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primario">Pedir revisión</button>}
      {!abierto && error && <p role="alert" className="text-sm text-error">{error}</p>}
      <Modal abierto={abierto} titulo="Pedir revisión" onCerrar={cerrar}>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <CampoFormulario id={`motivo-revision-${aporte.id}`} label="Motivo" error={error} hint="Contá qué información considerás incorrecta. Máximo 1000 caracteres.">
            <textarea value={motivo} onChange={(evento) => setMotivo(evento.target.value)} maxLength={1000} rows={4} disabled={enviando} autoFocus className="w-full rounded-sm border border-borde bg-superficie p-3 text-texto focus-visible:outline-2 focus-visible:outline-primario" />
          </CampoFormulario>
          <div className="flex flex-wrap gap-3">
            <Boton variant="secondary" onClick={cerrar} disabled={enviando}>Cancelar</Boton>
            <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</Boton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

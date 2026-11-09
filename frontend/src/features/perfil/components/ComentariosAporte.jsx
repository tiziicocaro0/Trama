import { useEffect, useId, useRef, useState } from 'react'
import { crearComentario, listarComentarios } from '../../../api/comentarios.js'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaHora } from '../../../utils/fechas.js'
import CampoMenciones from './CampoMenciones.jsx'

export default function ComentariosAporte({ aporte, usuarioId }) {
  const panelId = useId()
  const [abierto, setAbierto] = useState(false)
  const [comentarios, setComentarios] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [intento, setIntento] = useState(0)
  const [errorCarga, setErrorCarga] = useState('')
  const [texto, setTexto] = useState('')
  const [errorEnvio, setErrorEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const ocupado = useRef(false)

  useEffect(() => {
    if (!abierto) return undefined
    const controller = new AbortController()
    listarComentarios(aporte.proyectoId, aporte.id, controller.signal).then(
      (lista) => {
        if (!controller.signal.aborted) {
          setComentarios(lista)
          setCargando(false)
        }
      },
      (error) => {
        if (!controller.signal.aborted) {
          setErrorCarga(error.message)
          setCargando(false)
        }
      },
    )
    return () => controller.abort()
  }, [abierto, aporte.id, aporte.proyectoId, intento])

  function alternar() {
    if (!abierto) { setCargando(true); setErrorCarga('') }
    setAbierto((actual) => !actual)
  }

  function reintentar() {
    setCargando(true)
    setErrorCarga('')
    setIntento((actual) => actual + 1)
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado.current) return
    const contenido = texto.trim()
    if (!contenido) { setErrorEnvio('Escribí un comentario antes de enviarlo.'); return }
    if (new TextEncoder().encode(contenido).length > 4068) { setErrorEnvio('El comentario supera el tamaño permitido.'); return }
    ocupado.current = true
    setEnviando(true)
    setErrorEnvio('')
    try {
      const creado = await crearComentario(aporte.proyectoId, aporte.id, contenido)
      setComentarios((actuales) => [...(actuales ?? []).filter((item) => item.id !== creado.id), creado])
      setTexto('')
    } catch (error) { setErrorEnvio(error.message) }
    finally { ocupado.current = false; setEnviando(false) }
  }

  if (!aporte.id || !aporte.proyectoId) return null
  return (
    <div className="mt-2">
      <button type="button" aria-expanded={abierto} aria-controls={panelId} onClick={alternar} disabled={enviando} className="min-h-11 rounded-sm font-semibold text-secundario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primario disabled:opacity-50">
        Comentarios{comentarios !== null ? ` (${comentarios.length})` : ''}
      </button>
      {abierto && (
        <section id={panelId} aria-label={`Comentarios de ${aporte.titulo}`} className="mt-2 space-y-4 border-t border-borde pt-4">
          {cargando ? <p role="status" className="text-sm text-texto-suave">Cargando comentarios…</p> : errorCarga ? (
            <div className="space-y-2"><p role="alert" className="text-sm text-error">{errorCarga}</p><Boton variant="secondary" onClick={reintentar}>Reintentar</Boton></div>
          ) : comentarios && (
            <>
              {comentarios.length === 0 ? <p className="text-sm text-texto-suave">Todavía no hay comentarios.</p> : (
                <ul className="space-y-3">
                  {comentarios.map((comentario) => (
                    <li key={comentario.id} className="rounded-md bg-fondo p-3 text-sm">
                      <p className="font-semibold text-secundario">{comentario.autorNombre}</p>
                      <time dateTime={comentario.fecha} className="text-xs text-texto-suave">{formatearFechaHora(comentario.fecha) || comentario.fecha}</time>
                      <p className="mt-1 whitespace-pre-wrap break-words text-texto">{comentario.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
              {!aporte.archivado && (
                <form onSubmit={enviar} noValidate className="space-y-3">
                  <CampoMenciones proyectoId={aporte.proyectoId} usuarioId={usuarioId} valor={texto} onChange={setTexto} disabled={enviando} />
                  {errorEnvio && <p role="alert" className="text-sm text-error">{errorEnvio}</p>}
                  <Boton type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar comentario'}</Boton>
                </form>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}

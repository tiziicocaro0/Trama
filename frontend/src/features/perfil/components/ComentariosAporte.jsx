import { ChatCircle, PaperPlaneRight } from '@phosphor-icons/react'
import { useContext, useEffect, useId, useState } from 'react'
import { comentar, listarComentarios } from '../../../api/comentarios.js'
import { listarMiembros } from '../../../api/miembros.js'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaHora } from '../../../utils/fechas.js'
import AuthContext from '../../auth/AuthContext.js'
import CampoMenciones from './CampoMenciones.jsx'

const MAXIMO = 2000
const ROLES = { TUTOR: 'Tutor/a', FAMILIAR: 'Familiar', EDUCACION: 'Educación', SALUD: 'Salud' }

// Las @menciones se resaltan dentro del comentario
function conMenciones(texto, nombres) {
  if (!nombres.length) return texto
  const escapar = (valor) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patron = new RegExp(`(@(?:${nombres.map(escapar).join('|')}))`, 'g')
  return texto.split(patron).map((parte, indice) =>
    indice % 2 === 1 ? <strong key={indice} className="font-semibold text-primario">{parte}</strong> : parte,
  )
}

// 6.2: comentarios de un aporte. Se ve cuántos hay; al abrirlos se leen y se puede comentar.
export default function ComentariosAporte({ aporte }) {
  const usuario = useContext(AuthContext)?.usuario ?? null
  const idPanel = useId()
  const [abierto, setAbierto] = useState(false)
  const [comentarios, setComentarios] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cantidad = comentarios?.length ?? aporte.comentarios ?? 0

  // Los comentarios y los miembros (para las @menciones) se traen recién al abrir
  useEffect(() => {
    if (!abierto || comentarios !== null) return undefined
    const control = new AbortController()
    listarComentarios(aporte.proyectoId, aporte.id, control.signal)
      .then(setComentarios)
      .catch((err) => {
        if (!control.signal.aborted) setError(err.message)
      })
    listarMiembros(aporte.proyectoId, control.signal)
      .then((lista) =>
        setMiembros(
          lista
            .filter((miembro) => miembro.usuarioId !== usuario?.id)
            .map((miembro) => ({
              id: miembro.id,
              nombre: `${miembro.nombre} ${miembro.apellido}`.trim(),
              detalle: ROLES[miembro.rol],
            })),
        ),
      )
      .catch(() => {})
    return () => control.abort()
  }, [abierto, comentarios, aporte.proyectoId, aporte.id, usuario?.id])

  async function publicar(evento) {
    evento.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setError('')
    try {
      const nuevo = await comentar(aporte.proyectoId, aporte.id, texto)
      setComentarios((actuales) => [...(actuales ?? []), nuevo])
      setTexto('')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!aporte.proyectoId) return null
  const nombres = miembros.map((miembro) => miembro.nombre)
    .concat([usuario?.nombre, usuario?.apellido].filter(Boolean).join(' '))
    .filter(Boolean)

  return (
    <div className="mt-3 border-t border-borde pt-3">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        aria-controls={abierto ? idPanel : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-secundario transition-colors hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none"
      >
        <ChatCircle size={18} aria-hidden="true" />
        {cantidad === 0 ? 'Comentar' : cantidad === 1 ? '1 comentario' : `${cantidad} comentarios`}
      </button>

      {abierto && (
        <div id={idPanel} className="mt-2 space-y-3">
          {comentarios === null && !error && <p className="text-sm text-texto-suave">Cargando comentarios…</p>}
          {comentarios?.length > 0 && (
            <ul aria-label={`Comentarios de ${aporte.titulo}`} className="space-y-2">
              {comentarios.map((comentario) => (
                <li key={comentario.id} className="rounded-md bg-fondo p-3 text-sm">
                  <p className="text-xs text-texto-suave">
                    <span className="font-semibold text-secundario">{comentario.autorNombre}</span>
                    {comentario.fecha && <> · <time dateTime={comentario.fecha}>{formatearFechaHora(comentario.fecha)}</time></>}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-texto">
                    {conMenciones(comentario.texto, nombres)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {!aporte.archivado && (
            <form onSubmit={publicar} className="space-y-2">
              <CampoMenciones
                id={`comentario-${aporte.id}`}
                etiqueta={`Comentar ${aporte.titulo}`}
                valor={texto}
                onCambiar={setTexto}
                miembros={miembros}
                disabled={enviando}
                maxLength={MAXIMO}
              />
              <div className="flex justify-end">
                <Boton type="submit" variant="secondary" disabled={enviando || !texto.trim()}>
                  <PaperPlaneRight size={18} aria-hidden="true" />
                  {enviando ? 'Publicando…' : 'Publicar'}
                </Boton>
              </div>
            </form>
          )}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  )
}

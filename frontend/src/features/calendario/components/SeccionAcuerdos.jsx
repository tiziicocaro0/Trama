import { useEffect, useState } from 'react'
import { Handshake, Plus } from '@phosphor-icons/react'
import { crearAcuerdo, listarAcuerdos, marcarAcuerdoCumplido } from '../../../api/acuerdos.js'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import { formatearFechaCalendario } from '../../../utils/fechas.js'

function nombreMiembro(miembro) {
  return [miembro.nombre, miembro.apellido].filter(Boolean).join(' ').trim()
}

// 5.6: acuerdos de una reunión. Cada uno con responsable, fecha de revisión y "Cumplido".
// Un acuerdo vencido y sin cumplir se marca acá, y su responsable recibe un aviso (back).
export default function SeccionAcuerdos({ proyectoId, reunion, miembros = [], puedeAgregar = false }) {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [nuevo, setNuevo] = useState({ descripcion: '', responsableId: '', fechaRevision: '' })
  const [enviando, setEnviando] = useState(false)
  const [marcandoId, setMarcandoId] = useState(null)
  const [error, setError] = useState('')
  const clave = `${reunion.id}:${version}`

  useEffect(() => {
    const controller = new AbortController()
    listarAcuerdos(proyectoId, reunion.id, controller.signal).then(
      (acuerdos) => {
        if (!controller.signal.aborted) setResultado({ clave, acuerdos })
      },
      (problema) => {
        if (!controller.signal.aborted) setResultado({ clave, error: problema.message })
      },
    )
    return () => controller.abort()
  }, [proyectoId, reunion.id, clave])

  const acuerdos = resultado?.acuerdos ?? []
  const errorCarga = resultado?.clave === clave ? resultado.error : null

  async function guardar(evento) {
    evento.preventDefault()
    if (enviando) return
    if (!nuevo.descripcion.trim() || !nuevo.responsableId || !nuevo.fechaRevision) {
      setError('Completá el acuerdo, el responsable y la fecha de revisión.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await crearAcuerdo(proyectoId, { reunionId: reunion.id, ...nuevo })
      setNuevo({ descripcion: '', responsableId: '', fechaRevision: '' })
      setFormularioAbierto(false)
      setVersion((actual) => actual + 1)
    } catch (problema) {
      setError(problema.message)
    } finally {
      setEnviando(false)
    }
  }

  async function alternarCumplido(acuerdo) {
    if (marcandoId) return
    setMarcandoId(acuerdo.id)
    setError('')
    try {
      await marcarAcuerdoCumplido(proyectoId, acuerdo.id, !acuerdo.cumplido)
      setVersion((actual) => actual + 1)
    } catch (problema) {
      setError(problema.message)
    } finally {
      setMarcandoId(null)
    }
  }

  return (
    <section aria-label="Acuerdos de la reunión" className="mt-4 rounded-md border border-borde bg-fondo p-4">
      <h4 className="flex items-center gap-1.5 font-semibold text-secundario">
        <Handshake size={18} aria-hidden="true" />
        Acuerdos
      </h4>

      {(error || errorCarga) && (
        <div className="mt-3">
          <Aviso tipo="error">{error || errorCarga}</Aviso>
        </div>
      )}

      {!resultado ? (
        <p role="status" className="mt-2 text-sm text-texto-suave">Cargando acuerdos…</p>
      ) : acuerdos.length ? (
        <ul className="mt-2 divide-y divide-borde/60">
          {acuerdos.map((acuerdo) => (
            <li key={acuerdo.id} className="py-2">
              <CasillaOvillo
                checked={Boolean(acuerdo.cumplido)}
                onChange={() => alternarCumplido(acuerdo)}
                disabled={!acuerdo.puedeMarcarCumplido || marcandoId === acuerdo.id}
              >
                <span className="block break-words">{acuerdo.descripcion}</span>
                <span className="mt-0.5 block text-xs text-texto-suave">
                  {acuerdo.responsableNombre} · revisar el {formatearFechaCalendario(acuerdo.fechaRevision) || acuerdo.fechaRevision}
                  {acuerdo.cumplido ? ' · Cumplido' : ''}
                </span>
                {acuerdo.vencido && (
                  <span className="mt-1 inline-flex rounded-pill bg-primario/10 px-2 py-0.5 text-xs font-semibold text-primario">
                    Vencido
                  </span>
                )}
              </CasillaOvillo>
            </li>
          ))}
        </ul>
      ) : (
        !errorCarga && <p className="mt-2 text-sm text-texto-suave">Todavía no hay acuerdos.</p>
      )}

      {puedeAgregar && !formularioAbierto && (
        <Boton variant="secondary" onClick={() => setFormularioAbierto(true)} className="mt-3 w-full">
          <Plus size={16} aria-hidden="true" />
          Agregar acuerdo
        </Boton>
      )}

      {puedeAgregar && formularioAbierto && (
        <form onSubmit={guardar} noValidate aria-label="Nuevo acuerdo" className="mt-3 space-y-3">
          <div>
            <label htmlFor={`acuerdo-descripcion-${reunion.id}`} className="mb-1 block text-sm font-semibold">
              Qué se acordó
            </label>
            <textarea
              id={`acuerdo-descripcion-${reunion.id}`}
              value={nuevo.descripcion}
              onChange={(e) => setNuevo((actual) => ({ ...actual, descripcion: e.target.value }))}
              maxLength={500}
              rows={3}
              disabled={enviando}
              className="w-full rounded-md border border-borde bg-superficie p-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            />
          </div>
          <div>
            <label htmlFor={`acuerdo-responsable-${reunion.id}`} className="mb-1 block text-sm font-semibold">
              Responsable
            </label>
            <select
              id={`acuerdo-responsable-${reunion.id}`}
              value={nuevo.responsableId}
              onChange={(e) => setNuevo((actual) => ({ ...actual, responsableId: e.target.value }))}
              disabled={enviando}
              className="min-h-11 w-full rounded-md border border-borde bg-superficie px-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              <option value="">Elegí a alguien de la red</option>
              {miembros.map((miembro) => (
                <option key={miembro.usuarioId ?? miembro.id} value={miembro.usuarioId ?? miembro.id}>
                  {nombreMiembro(miembro)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`acuerdo-fecha-${reunion.id}`} className="mb-1 block text-sm font-semibold">
              Fecha de revisión
            </label>
            <CampoFecha
              id={`acuerdo-fecha-${reunion.id}`}
              value={nuevo.fechaRevision}
              onChange={(e) => setNuevo((actual) => ({ ...actual, fechaRevision: e.target.value }))}
              disabled={enviando}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Boton type="button" variant="secondary" onClick={() => { setFormularioAbierto(false); setError('') }} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar acuerdo'}
            </Boton>
          </div>
        </form>
      )}
    </section>
  )
}

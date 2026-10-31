import { useEffect, useState } from 'react'
import { EnvelopeSimple } from '@phosphor-icons/react'
import {
  cancelarInvitacion,
  listarInvitacionesPendientes,
} from '../../../api/miembros.js'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaHora } from '../../../utils/fechas.js'

const etiquetasRol = {
  TUTOR: 'Co-tutor/a',
  FAMILIAR: 'Familiar',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
}

// 1.3: invitaciones que todavía no se aceptaron, con su vencimiento (7 días).
// Solo la ve un tutor administrador. "version" cambia cuando se envía una invitación nueva.
export default function InvitacionesPendientes({ proyectoId, version = 0 }) {
  const [cancelaciones, setCancelaciones] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [cancelandoId, setCancelandoId] = useState(null)
  const [errorCancelar, setErrorCancelar] = useState('')
  const clave = `${proyectoId}:${version}:${cancelaciones}`

  useEffect(() => {
    const controller = new AbortController()
    listarInvitacionesPendientes(proyectoId, controller.signal).then(
      (invitaciones) => {
        if (!controller.signal.aborted) setResultado({ clave, invitaciones })
      },
      () => {
        if (!controller.signal.aborted)
          setResultado({
            clave,
            error: 'No pudimos cargar las invitaciones pendientes.',
          })
      },
    )
    return () => controller.abort()
  }, [proyectoId, clave])

  // Mientras recarga se sigue mostrando la lista anterior, así no parpadea.
  const invitaciones = resultado?.invitaciones ?? []
  const error = resultado?.clave === clave ? resultado.error : null

  async function cancelar(invitacion) {
    if (cancelandoId) return
    setCancelandoId(invitacion.id)
    setErrorCancelar('')
    try {
      await cancelarInvitacion(proyectoId, invitacion.id)
      setCancelaciones((actual) => actual + 1)
    } catch (err) {
      setErrorCancelar(
        err?.response?.data?.mensaje ||
          'No pudimos cancelar la invitación. Intentá nuevamente.',
      )
    } finally {
      setCancelandoId(null)
    }
  }

  if (!resultado) return null

  return (
    <section aria-labelledby="titulo-invitaciones" className="mt-10">
      <h2
        id="titulo-invitaciones"
        className="font-display text-h2 text-secundario"
      >
        Invitaciones pendientes
      </h2>
      <p className="mt-2 text-texto-suave">
        Cada invitación vence a los 7 días. Si la cancelás, el link deja de
        funcionar.
      </p>

      {(error || errorCancelar) && (
        <div className="mt-4">
          <Aviso tipo="error">{error || errorCancelar}</Aviso>
        </div>
      )}

      {invitaciones.length ? (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {invitaciones.map((invitacion) => (
            <li
              key={invitacion.id}
              className="flex flex-col justify-between gap-4 rounded-lg bg-superficie p-6 shadow-sm sm:flex-row sm:items-start"
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-decoracion text-secundario">
                  <EnvelopeSimple size={24} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {invitacion.email}
                  </p>
                  <p className="mt-1 text-texto-suave">
                    {etiquetasRol[invitacion.rol]}
                  </p>
                  <p className="mt-1 text-sm text-texto-suave">
                    Vence:{' '}
                    <time dateTime={invitacion.venceEn}>
                      {formatearFechaHora(invitacion.venceEn)}
                    </time>
                  </p>
                </div>
              </div>
              <Boton
                variant="secondary"
                onClick={() => cancelar(invitacion)}
                disabled={cancelandoId === invitacion.id}
                aria-label={`Cancelar la invitación a ${invitacion.email}`}
              >
                Cancelar
              </Boton>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <p className="mt-4 rounded-lg bg-superficie p-6">
            No hay invitaciones pendientes.
          </p>
        )
      )}
    </section>
  )
}

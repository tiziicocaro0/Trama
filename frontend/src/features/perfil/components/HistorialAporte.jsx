import { useEffect, useState } from 'react'
import { listarVersiones } from '../../../api/aportes.js'
import { Modal } from '../../../components/ui/Modal.jsx'
import { formatearFechaHora } from '../../../utils/fechas.js'

// 3.2: versiones de un aporte, de la más nueva a la más vieja. Solo lectura.
export default function HistorialAporte({ proyectoId, aporte, onCerrar }) {
  const [versiones, setVersiones] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    listarVersiones(proyectoId, aporte.id)
      .then((lista) => {
        if (vigente) setVersiones(lista)
      })
      .catch((errorCarga) => {
        if (vigente) setError(errorCarga.message)
      })
    return () => {
      vigente = false
    }
  }, [proyectoId, aporte.id])

  return (
    <Modal abierto titulo={`Historial: ${aporte.titulo}`} onCerrar={onCerrar}>
      {error ? (
        <p role="alert" className="text-error">
          {error}
        </p>
      ) : !versiones ? (
        <p role="status">Cargando el historial…</p>
      ) : (
        <>
          {versiones.length === 1 && (
            <p className="mb-3 text-sm text-texto-suave">
              Este aporte todavía no tiene ediciones.
            </p>
          )}
          <ol
            aria-label="Versiones del aporte"
            className="max-h-96 space-y-3 overflow-y-auto pr-1"
          >
            {versiones.map((version) => (
              <li
                key={version.numero}
                className="rounded-md border border-borde bg-superficie p-3"
              >
                <p className="text-xs font-semibold text-secundario">
                  {version.actual
                    ? `Versión ${version.numero} · actual`
                    : `Versión ${version.numero}`}
                </p>
                <p className="mt-1 font-semibold text-texto">{version.titulo}</p>
                {version.contenido && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave">
                    {version.contenido}
                  </p>
                )}
                <p className="mt-2 text-xs text-texto-suave">
                  {version.autorNombre && `${version.autorNombre} · `}
                  <time dateTime={version.fechaCreacion}>
                    {formatearFechaHora(version.fechaCreacion)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </Modal>
  )
}

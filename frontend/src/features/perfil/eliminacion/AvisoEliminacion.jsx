import { useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import { cancelarEliminacion } from '../../../api/proyectos.js'
import Boton from '../../../components/ui/Boton.jsx'
import { formatearFechaEliminacion, mensajeDeError } from './eliminacion.js'

// 8.2: aviso en la portada mientras el perfil tiene la eliminación programada.
// Lo ve toda la red; solo el tutor administrador puede cancelarla.
export default function AvisoEliminacion({ proyecto, esAdmin = false, onCancelada }) {
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')
  if (!proyecto?.eliminacionProgramada) return null

  async function cancelar() {
    setCancelando(true)
    setError('')
    try {
      const actualizado = await cancelarEliminacion(proyecto.id)
      onCancelada?.(actualizado)
    } catch (problema) {
      setError(mensajeDeError(problema, 'No pudimos cancelar la eliminación. Intentá nuevamente.'))
      setCancelando(false)
    }
  }

  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-error bg-error/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Warning size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-error" />
        <div>
          <p className="font-semibold text-texto">
            Este perfil se va a eliminar el {formatearFechaEliminacion(proyecto.eliminacionProgramada)}.
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Ese día se borra todo lo que cargó la red. Hasta entonces, un tutor administrador puede cancelarlo.
          </p>
          {error && <p className="mt-2 text-sm font-semibold text-error">{error}</p>}
        </div>
      </div>
      {esAdmin && (
        <Boton variant="secondary" onClick={cancelar} disabled={cancelando}>
          {cancelando ? 'Cancelando…' : 'Cancelar eliminación'}
        </Boton>
      )}
    </div>
  )
}

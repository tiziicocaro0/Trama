import { useState } from 'react'
import { FileText } from '@phosphor-icons/react'
import InfoAyuda from '../../../components/ui/InfoAyuda.jsx'
import { obtenerComprobanteMatricula } from '../../../api/cuenta.js'
import { AVISO_MATRICULA } from '../matricula.js'

// Matrícula de un profesional en la Red, con su comprobante si lo subió.
// conAviso: el (i) al lado del número (en Mi perfil ya está en el título).
export default function MatriculaMiembro({ usuarioId, matricula, tieneComprobante, conAviso = true }) {
  const [error, setError] = useState('')
  if (typeof matricula !== 'string' || !matricula.trim()) return null

  async function verComprobante() {
    setError('')
    // La pestaña se abre ya, en el clic: si se abre después de esperar, el navegador la bloquea.
    const pestana = window.open('', '_blank')
    try {
      const url = await obtenerComprobanteMatricula(usuarioId)
      if (pestana) pestana.location.href = url
      else window.location.assign(url)
    } catch {
      pestana?.close()
      setError('No pudimos abrir el comprobante.')
    }
  }

  return (
    <div className="mt-1 text-sm text-texto-suave">
      <p className="flex flex-wrap items-center gap-1 break-words">
        Matrícula: <span className="font-semibold text-texto">{matricula}</span>
        {conAviso && <InfoAyuda etiqueta="Sobre la matrícula">{AVISO_MATRICULA}</InfoAyuda>}
      </p>
      {tieneComprobante && (
        <button
          type="button"
          onClick={verComprobante}
          className="mt-1 inline-flex min-h-9 items-center gap-1.5 font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-primario"
        >
          <FileText size={16} aria-hidden="true" />
          Ver comprobante
        </button>
      )}
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
    </div>
  )
}

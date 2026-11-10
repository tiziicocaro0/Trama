import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import { descargarPdfPerfil } from '../../../api/exportacion.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'

// 8.3: descarga el perfil o "Conocelo en 5 minutos" en PDF, solo con lo que la persona puede ver.
// seccion: 'perfil' o 'conocelo'.
export default function DescargarPdfPerfil({ proyectoId, seccion, variant = 'secondary', className = '' }) {
  const [descargando, setDescargando] = useState(false)

  async function descargar() {
    if (descargando) return
    setDescargando(true)
    try {
      await descargarPdfPerfil(proyectoId, seccion)
      avisar('Descargamos el PDF.')
    } catch {
      avisarError('No pudimos preparar el PDF. Intentá nuevamente.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <Boton variant={variant} tamano="chico" onClick={descargar} disabled={descargando} className={className}>
      <DownloadSimple size={18} aria-hidden="true" />
      {descargando ? 'Preparando…' : 'Descargar PDF'}
    </Boton>
  )
}

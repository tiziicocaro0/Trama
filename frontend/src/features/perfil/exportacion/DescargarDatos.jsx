import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import { descargarTodosLosDatos } from '../../../api/exportacion.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'
import FiltrosExportacion from './FiltrosExportacion.jsx'

// 8.1: los tutores descargan toda la información del niño (derecho de acceso).
export default function DescargarDatos({ proyecto }) {
  const [descargando, setDescargando] = useState(null)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  async function descargar(formato, filtros = {}) {
    if (descargando) return
    setDescargando(formato)
    try {
      await descargarTodosLosDatos(proyecto.id, formato, filtros)
      setFiltrosAbiertos(false)
      avisar('Descargamos los datos.')
    } catch (problema) {
      avisarError(
        problema?.response?.status === 403
          ? 'Solo los tutores pueden descargar todos los datos.'
          : 'No pudimos preparar la descarga. Intentá nuevamente.',
      )
    } finally {
      setDescargando(null)
    }
  }

  return (
    <section
      aria-labelledby="titulo-descargar-datos"
      className="mt-6 rounded-lg bg-superficie p-5 shadow-sm sm:p-8"
    >
      <h2 id="titulo-descargar-datos" className="font-display text-h2 text-secundario">
        Descargar todos los datos
      </h2>
      <p className="mt-2 text-texto-suave">
        Un archivo con todo lo que hay en el perfil de {proyecto.nombre}: datos personales, red,
        aportes, notas, eventos y acuerdos, en un PDF para leer o imprimir.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {/* El PDF abre antes los filtros */}
        <Boton onClick={() => setFiltrosAbiertos(true)} disabled={Boolean(descargando)}>
          <DownloadSimple size={18} aria-hidden="true" />
          Descargar PDF
        </Boton>
      </div>
      <FiltrosExportacion
        abierto={filtrosAbiertos}
        proyectoId={proyecto.id}
        descargando={descargando === 'pdf'}
        onCerrar={() => setFiltrosAbiertos(false)}
        onDescargar={(filtros) => descargar('pdf', filtros)}
      />
    </section>
  )
}

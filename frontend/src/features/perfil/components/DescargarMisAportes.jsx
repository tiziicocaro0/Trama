import { useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import { descargarMisAportes } from '../../../api/exportacion.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'

const FORMATOS = [
  { formato: 'pdf', etiqueta: 'Descargar PDF', variante: 'primary' },
  { formato: 'json', etiqueta: 'Descargar JSON', variante: 'secondary' },
]

// 8.4: cada miembro descarga lo que cargó en este niño, para conservarlo.
// Va en la propia tarjeta de la página Red, junto al nombre.
export default function DescargarMisAportes({ proyecto }) {
  const [abierto, setAbierto] = useState(false)
  const [descargando, setDescargando] = useState(null)

  async function descargar(formato) {
    if (descargando) return
    setDescargando(formato)
    try {
      await descargarMisAportes(proyecto.id, formato)
      setAbierto(false)
      avisar('Descargamos tus aportes.')
    } catch {
      avisarError('No pudimos preparar la descarga. Intentá nuevamente.')
    } finally {
      setDescargando(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primario hover:text-primario-hover"
      >
        <DownloadSimple size={16} aria-hidden="true" />
        Descargar mis aportes
      </button>
      <Modal abierto={abierto} titulo="Descargar mis aportes" onCerrar={() => setAbierto(false)} cerrarAlTocarFuera>
        <div className="space-y-4 text-texto">
          <p>
            Un archivo con todo lo que cargaste en el perfil de {proyecto.nombre}, también lo archivado. No incluye
            lo que cargaron otras personas.
          </p>
          <p className="text-sm text-texto-suave">
            Si vas a salir de la red, descargalo antes: después no vas a poder entrar.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {FORMATOS.map(({ formato, etiqueta, variante }) => (
              <Boton
                key={formato}
                variant={variante}
                onClick={() => descargar(formato)}
                disabled={Boolean(descargando)}
              >
                <DownloadSimple size={18} aria-hidden="true" />
                {descargando === formato ? 'Preparando…' : etiqueta}
              </Boton>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}

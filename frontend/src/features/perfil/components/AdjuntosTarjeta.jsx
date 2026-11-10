import { FilePdf, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { useState } from 'react'
import { descargarArchivo, obtenerUrlDescargaArchivo, obtenerVistaImagen } from '../../../api/archivos.js'
import { Modal } from '../../../components/ui/Modal.jsx'
import useImagenRemota from '../../../hooks/useImagenRemota.js'

export function esArchivoPdf(archivo) {
  const mime = (archivo?.tipoMime ?? '').toLowerCase()
  const nombre = (archivo?.nombreOriginal ?? '').toLowerCase()
  return mime === 'application/pdf' || nombre.endsWith('.pdf')
}

// La imagen se ve dentro de la tarjeta; al tocarla se abre grande
function ImagenAdjunta({ proyectoId, archivo, onAbrir }) {
  const nombre = archivo.nombreOriginal || 'Imagen adjunta'
  const url = useImagenRemota(`${proyectoId}:${archivo.id}`, () => obtenerVistaImagen(proyectoId, archivo.id))
  return (
    <button
      type="button"
      onClick={() => url && onAbrir({ url, nombre })}
      aria-label={`Ver más grande: ${nombre}`}
      className="group relative block h-40 w-full overflow-hidden rounded-md border border-borde bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
    >
      {url ? (
        <img src={url} alt={nombre} className="size-full object-contain transition-transform group-hover:scale-105 motion-reduce:transition-none" />
      ) : (
        <span className="flex size-full items-center justify-center text-sm text-texto-suave">Cargando imagen…</span>
      )}
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-superficie text-primario shadow-sm"
      >
        <MagnifyingGlassPlus size={18} />
      </span>
    </button>
  )
}

// 4.3: los adjuntos de un aporte. Las imágenes se ven en la tarjeta; los PDF se descargan.
export default function AdjuntosTarjeta({ proyectoId, archivos }) {
  const [ampliada, setAmpliada] = useState(null)
  const [error, setError] = useState('')
  if (!archivos.length) return null
  const imagenes = archivos.filter((archivo) => !esArchivoPdf(archivo))
  const pdfs = archivos.filter(esArchivoPdf)

  async function descargar(evento, archivo) {
    if (!proyectoId) return
    evento.preventDefault()
    setError('')
    try {
      await descargarArchivo(proyectoId, archivo.id, archivo.nombreOriginal)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {imagenes.length > 0 && (
        <ul aria-label="Imágenes adjuntas" className={`grid gap-2 ${imagenes.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {imagenes.map((archivo) => (
            <li key={archivo.id}>
              <ImagenAdjunta proyectoId={proyectoId} archivo={archivo} onAbrir={setAmpliada} />
            </li>
          ))}
        </ul>
      )}
      {pdfs.length > 0 && (
        <ul aria-label="Archivos adjuntos" className="flex flex-wrap gap-2">
          {pdfs.map((archivo) => {
            const nombre = archivo.nombreOriginal || 'Archivo adjunto'
            return (
              <li key={archivo.id}>
                <a
                  href={obtenerUrlDescargaArchivo(proyectoId, archivo.id)}
                  download={nombre}
                  onClick={(evento) => descargar(evento, archivo)}
                  className="inline-flex items-center gap-2 rounded-sm border border-borde bg-superficie px-3 py-1.5 text-sm font-semibold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                >
                  <FilePdf size={18} role="img" aria-label="Ícono PDF" className="shrink-0" />
                  {nombre}
                </a>
              </li>
            )
          })}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <Modal abierto={Boolean(ampliada)} titulo={ampliada?.nombre ?? ''} onCerrar={() => setAmpliada(null)} cerrarAlTocarFuera ancho="max-w-3xl">
        {ampliada && <img src={ampliada.url} alt={ampliada.nombre} className="max-h-svh w-full object-contain" />}
      </Modal>
    </div>
  )
}

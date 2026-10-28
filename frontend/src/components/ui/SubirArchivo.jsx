import { FileImage, FilePdf, Trash, UploadSimple } from '@phosphor-icons/react'
import { useId, useRef, useState } from 'react'
import { subirArchivo, validarArchivoAdjunto } from '../../api/archivos.js'
import Boton from './Boton.jsx'

function esPdf(archivo) {
  const mime = (archivo?.tipoMime ?? archivo?.type ?? '').toLowerCase()
  const nombre = (archivo?.nombreOriginal ?? archivo?.name ?? '').toLowerCase()
  return mime === 'application/pdf' || nombre.endsWith('.pdf')
}

export default function SubirArchivo({
  proyectoId,
  archivos = [],
  onChange,
  disabled = false,
}) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function procesarArchivo(archivo) {
    if (!archivo || disabled || subiendo) return

    const mensajeInvalido = validarArchivoAdjunto(archivo)
    if (mensajeInvalido) {
      setError(mensajeInvalido)
      return
    }

    setError('')
    setSubiendo(true)
    try {
      const subido = await subirArchivo(proyectoId, archivo)
      onChange?.([...archivos, subido])
    } catch (err) {
      setError(
        err?.message ||
          'No pudimos adjuntar el archivo. Intentá nuevamente.',
      )
    } finally {
      setSubiendo(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  function manejarSeleccion(evento) {
    const archivo = evento.target.files?.[0]
    if (archivo) {
      procesarArchivo(archivo)
    }
  }

  function manejarDragOver(evento) {
    evento.preventDefault()
    if (!disabled && !subiendo) {
      setArrastrando(true)
    }
  }

  function manejarDragLeave(evento) {
    evento.preventDefault()
    setArrastrando(false)
  }

  function manejarDrop(evento) {
    evento.preventDefault()
    setArrastrando(false)
    if (disabled || subiendo) return
    const archivo = evento.dataTransfer?.files?.[0]
    if (archivo) {
      procesarArchivo(archivo)
    }
  }

  function quitarArchivo(id) {
    onChange?.(archivos.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className="block font-semibold text-texto"
      >
        Archivos adjuntos (opcional)
      </label>

      <div
        onDragOver={manejarDragOver}
        onDragLeave={manejarDragLeave}
        onDrop={manejarDrop}
        data-testid="zona-soltar-archivo"
        className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center transition-colors ${
          arrastrando
            ? 'border-primario bg-superficie'
            : 'border-borde bg-superficie/70'
        }`}
      >
        <UploadSimple
          size={24}
          aria-hidden="true"
          className="text-secundario"
        />
        <p className="text-sm text-texto-suave">
          Arrastrá y soltá un archivo acá o elegilo desde tu dispositivo (PDF,
          JPG o PNG de hasta 20 MB).
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={manejarSeleccion}
          disabled={disabled || subiendo}
          className="sr-only"
        />
        <Boton
          type="button"
          variant="secondary"
          disabled={disabled || subiendo}
          onClick={() => inputRef.current?.click()}
        >
          {subiendo ? 'Subiendo archivo…' : 'Seleccionar archivo'}
        </Boton>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {archivos.length > 0 && (
        <ul className="space-y-2" aria-label="Archivos listos para adjuntar">
          {archivos.map((archivo) => {
            const Icono = esPdf(archivo) ? FilePdf : FileImage
            const nombre = archivo.nombreOriginal || archivo.name || 'Adjunto'
            return (
              <li
                key={archivo.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-borde bg-superficie px-3 py-2 text-sm text-texto"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icono
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-primario"
                  />
                  <span className="truncate font-medium">{nombre}</span>
                </span>
                <button
                  type="button"
                  onClick={() => quitarArchivo(archivo.id)}
                  disabled={disabled || subiendo}
                  aria-label={`Quitar adjunto ${nombre}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-secundario hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                >
                  <Trash size={16} aria-hidden="true" />
                  Quitar
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


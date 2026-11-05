import { useEffect, useRef, useState } from 'react'
import { Camera, Trash } from '@phosphor-icons/react'
import { Aviso } from './Aviso.jsx'
import FotoCircular from './FotoCircular.jsx'
import RecortadorFoto from './RecortadorFoto.jsx'

// La foto original solo se lee en el navegador para recortarla; lo que se sube pesa poco.
const TAMANO_MAXIMO_ORIGINAL = 15 * 1024 * 1024
const TIPOS = ['image/jpeg', 'image/png']

// Elegir, recortar y guardar una foto de perfil (de la cuenta o del niño).
export default function EditorFoto({ src, nombre, onGuardar, onQuitar, tituloRecorte }) {
  const entrada = useRef(null)
  const [original, setOriginal] = useState(null)
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [quitando, setQuitando] = useState(false)

  // Libera la imagen elegida cuando se cierra el recortador.
  useEffect(() => () => original && window.URL.revokeObjectURL(original), [original])

  function elegir(event) {
    const archivo = event.target.files?.[0]
    event.target.value = ''
    if (!archivo) return
    if (!TIPOS.includes(archivo.type)) {
      setEstado({ tipo: 'error', texto: 'Elegí una foto en JPG o PNG.' })
      return
    }
    if (archivo.size > TAMANO_MAXIMO_ORIGINAL) {
      setEstado({ tipo: 'error', texto: 'La foto es muy pesada. Elegí una de menos de 15 MB.' })
      return
    }
    setEstado({ tipo: null, texto: '' })
    setOriginal(window.URL.createObjectURL(archivo))
  }

  async function guardar(recorte) {
    try {
      await onGuardar(recorte)
      setOriginal(null)
      setEstado({ tipo: 'exito', texto: 'Guardamos la foto.' })
    } catch (falla) {
      throw new Error(
        falla?.response?.data?.mensaje || 'No pudimos guardar la foto. Intentá nuevamente.',
        { cause: falla },
      )
    }
  }

  async function quitar() {
    setQuitando(true)
    setEstado({ tipo: null, texto: '' })
    try {
      await onQuitar()
      setEstado({ tipo: 'exito', texto: 'Quitamos la foto.' })
    } catch {
      setEstado({ tipo: 'error', texto: 'No pudimos quitar la foto. Intentá nuevamente.' })
    } finally {
      setQuitando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <FotoCircular src={src} nombre={nombre} className="size-24" tamanoIcono={40} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-contorno-accion px-4 font-semibold text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            <Camera size={20} aria-hidden="true" />
            {src ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {src && (
            <button
              type="button"
              onClick={quitar}
              disabled={quitando}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm px-4 font-semibold text-error hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-wait"
            >
              <Trash size={20} aria-hidden="true" />
              {quitando ? 'Quitando…' : 'Quitar foto'}
            </button>
          )}
        </div>
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png"
          onChange={elegir}
          className="sr-only"
          aria-label="Elegir una foto"
          tabIndex={-1}
        />
      </div>
      {estado.texto && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}
      {original && (
        <RecortadorFoto
          src={original}
          titulo={tituloRecorte}
          onCancelar={() => setOriginal(null)}
          onConfirmar={guardar}
        />
      )}
    </div>
  )
}

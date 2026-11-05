import { useEffect, useRef, useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { avisar, avisarError } from '../avisos/avisosFlotantes.js'
import FotoCircular from './FotoCircular.jsx'
import RecortadorFoto from './RecortadorFoto.jsx'

// La foto original solo se lee en el navegador para recortarla; lo que se sube pesa poco.
const TAMANO_MAXIMO_ORIGINAL = 15 * 1024 * 1024
const TIPOS = ['image/jpeg', 'image/png']

// Foto de perfil (de la cuenta o del niño) con un lápiz en la esquina para cambiarla:
// se elige, se recorta y se guarda. Los resultados salen como avisos flotantes.
export default function EditorFoto({
  src,
  nombre,
  onGuardar,
  tituloRecorte,
  className = 'size-24',
  claseIcono,
  tamanoIcono = 40,
}) {
  const entrada = useRef(null)
  const [original, setOriginal] = useState(null)

  // Libera la imagen elegida cuando se cierra el recortador.
  useEffect(() => () => original && window.URL.revokeObjectURL(original), [original])

  function elegir(event) {
    const archivo = event.target.files?.[0]
    event.target.value = ''
    if (!archivo) return
    if (!TIPOS.includes(archivo.type)) {
      avisarError('Elegí una foto en JPG o PNG.')
      return
    }
    if (archivo.size > TAMANO_MAXIMO_ORIGINAL) {
      avisarError('La foto es muy pesada. Elegí una de menos de 15 MB.')
      return
    }
    setOriginal(window.URL.createObjectURL(archivo))
  }

  async function guardar(recorte) {
    try {
      await onGuardar(recorte)
      setOriginal(null)
      avisar('Guardamos la foto.')
    } catch (falla) {
      throw new Error(
        falla?.response?.data?.mensaje || 'No pudimos guardar la foto. Intentá nuevamente.',
        { cause: falla },
      )
    }
  }

  return (
    <>
      <div className="relative inline-flex shrink-0">
        <FotoCircular
          src={src}
          nombre={nombre}
          className={className}
          claseIcono={claseIcono}
          tamanoIcono={tamanoIcono}
        />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          aria-label={src ? 'Cambiar foto' : 'Subir foto'}
          title={src ? 'Cambiar foto' : 'Subir foto'}
          className="absolute -bottom-1 -right-1 inline-flex size-9 items-center justify-center rounded-full border-2 border-superficie bg-primario text-superficie shadow-md hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        >
          <PencilSimple size={18} weight="bold" aria-hidden="true" />
        </button>
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
      {original && (
        <RecortadorFoto
          src={original}
          titulo={tituloRecorte}
          onCancelar={() => setOriginal(null)}
          onConfirmar={guardar}
        />
      )}
    </>
  )
}

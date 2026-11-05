import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react'
import Boton from './Boton.jsx'
import { Modal } from './Modal.jsx'
import { recortarImagen } from '../../utils/recortarImagen.js'

// Encuadre de la foto antes de subirla: se arrastra para ubicarla y se acerca con
// la barra (o pellizcando en el celular). Lo que queda en el círculo es la foto.
export default function RecortadorFoto({ src, titulo = 'Encuadrá la foto', onCancelar, onConfirmar }) {
  const [posicion, setPosicion] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [zona, setZona] = useState(null)
  const [recortando, setRecortando] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    if (!zona || recortando) return
    setRecortando(true)
    setError('')
    try {
      await onConfirmar(await recortarImagen(src, zona))
    } catch (falla) {
      setError(falla?.message || 'No pudimos recortar la foto. Probá con otra.')
      setRecortando(false)
    }
  }

  return (
    <Modal abierto titulo={titulo} onCerrar={recortando ? () => {} : onCancelar}>
      <div className="relative h-72 overflow-hidden rounded-md bg-texto sm:h-80">
        <Cropper
          image={src}
          crop={posicion}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setPosicion}
          onZoomChange={setZoom}
          onCropComplete={(_, pixeles) => setZona(pixeles)}
        />
      </div>
      <label className="mt-4 flex items-center gap-3">
        <MagnifyingGlassMinus size={20} aria-hidden="true" className="shrink-0 text-secundario" />
        <span className="sr-only">Acercar o alejar</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          disabled={recortando}
          className="w-full accent-primario"
        />
        <MagnifyingGlassPlus size={20} aria-hidden="true" className="shrink-0 text-secundario" />
      </label>
      <p className="mt-2 text-sm text-texto-suave">
        Arrastrá la foto para ubicarla. Lo que queda dentro del círculo es lo que se ve.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Boton variant="secondary" onClick={onCancelar} disabled={recortando}>
          Cancelar
        </Boton>
        <Boton onClick={confirmar} disabled={!zona || recortando}>
          {recortando ? 'Guardando…' : 'Usar esta foto'}
        </Boton>
      </div>
    </Modal>
  )
}

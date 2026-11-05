import { useRef, useState } from 'react'
import { IdentificationCard, Paperclip } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { actualizarMatricula, subirComprobanteMatricula } from '../../api/cuenta.js'
import { TAMANO_MAXIMO_COMPROBANTE, TIPOS_COMPROBANTE } from '../perfil/matricula.js'

// Sumar o cambiar la matrícula: el número es obligatorio y el comprobante, opcional.
export default function ModalMatricula({ matriculaActual = '', tieneComprobante, onCerrar, onGuardada }) {
  const [numero, setNumero] = useState(matriculaActual)
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const entrada = useRef(null)

  function elegir(event) {
    const elegido = event.target.files?.[0] ?? null
    setErrores((actuales) => ({ ...actuales, comprobante: undefined }))
    if (!elegido) return setArchivo(null)
    if (!TIPOS_COMPROBANTE.includes(elegido.type)) {
      event.target.value = ''
      setArchivo(null)
      return setErrores((actuales) => ({ ...actuales, comprobante: 'El comprobante tiene que ser PDF, JPG o PNG.' }))
    }
    if (elegido.size > TAMANO_MAXIMO_COMPROBANTE) {
      event.target.value = ''
      setArchivo(null)
      return setErrores((actuales) => ({ ...actuales, comprobante: 'El comprobante no puede superar los 5 MB.' }))
    }
    setArchivo(elegido)
  }

  async function guardar(event) {
    event.preventDefault()
    if (guardando) return
    const limpio = numero.trim()
    if (!limpio) return setErrores({ numero: 'Ingresá el número de matrícula.' })
    if (limpio.length > 40) return setErrores({ numero: 'La matrícula no puede superar los 40 caracteres.' })
    setErrores({})
    setMensaje('')
    setGuardando(true)
    try {
      // Primero el número: el comprobante solo se puede subir si hay número.
      let cuenta = await actualizarMatricula(limpio)
      if (archivo) cuenta = await subirComprobanteMatricula(archivo)
      onGuardada(cuenta)
    } catch (falla) {
      setMensaje(falla?.response?.data?.mensaje || 'No pudimos guardar la matrícula. Intentá nuevamente.')
      setGuardando(false)
    }
  }

  return (
    <Modal abierto titulo={matriculaActual ? 'Cambiar matrícula' : 'Sumar matrícula'} onCerrar={guardando ? () => {} : onCerrar}>
      <form onSubmit={guardar} noValidate aria-label="Datos de la matrícula" aria-busy={guardando} className="space-y-4">
        <CampoFormulario id="matricula-numero" label="Número de matrícula" error={errores.numero}>
          <Campo
            name="matricula"
            placeholder="Número (ej.: MN 45.123)"
            icon={IdentificationCard}
            value={numero}
            onChange={(event) => {
              setNumero(event.target.value)
              setErrores((actuales) => ({ ...actuales, numero: undefined }))
            }}
            maxLength={40}
            required
            disabled={guardando}
          />
        </CampoFormulario>

        <div>
          <p className="mb-2 font-semibold text-texto">Comprobante (opcional)</p>
          {/* El selector nativo queda oculto: se abre con el botón, con el estilo de TRAMA */}
          <input
            ref={entrada}
            id="matricula-comprobante"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={elegir}
            disabled={guardando}
            aria-label="Comprobante (opcional)"
            aria-invalid={Boolean(errores.comprobante)}
            aria-describedby="matricula-comprobante-ayuda"
            tabIndex={-1}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={guardando}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-contorno-accion px-4 font-semibold text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              <Paperclip size={18} aria-hidden="true" />
              {archivo ? 'Cambiar archivo' : 'Elegir archivo'}
            </button>
            <span className="min-w-0 break-all text-sm text-texto-suave">
              {archivo ? archivo.name : 'Ningún archivo elegido'}
            </span>
          </div>
          <p id="matricula-comprobante-ayuda" className="mt-2 text-sm text-texto-suave">
            PDF, JPG o PNG de hasta 5 MB.{' '}
            {tieneComprobante && 'Si subís otro, reemplaza al anterior. '}
            Lo ve la red de cada niño en el que participás: si tiene datos que no querés
            compartir, como tu DNI o tu domicilio, tapalos antes de subirlo.
          </p>
          {errores.comprobante && <p className="mt-2 text-sm text-error">{errores.comprobante}</p>}
        </div>

        {mensaje && (
          <p role="alert" className="rounded-sm border border-error p-3 text-error">
            {mensaje}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Boton variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar matrícula'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

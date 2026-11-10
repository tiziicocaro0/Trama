import { ArrowDown, ArrowUp, ImageSquare, Plus, Trash, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { subirArchivo, validarArchivoAdjunto } from '../../../api/archivos.js'
import { esArchivoPdf } from './AdjuntosTarjeta.jsx'
import { LARGO_MAXIMO_PASO, MAXIMO_PASOS, moverPaso, nuevaClavePaso } from '../pasosRutina.js'

const BOTON_ICONO = 'flex size-11 shrink-0 items-center justify-center rounded-md text-secundario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-40'

// 2.7: los pasos de la rutina en orden. Cada paso tiene un texto y, si se quiere, una imagen.
// Se pueden agregar, quitar y mover hacia arriba o abajo.
export default function PasosRutina({ proyectoId, pasos, onChange, error, disabled }) {
  const [subiendo, setSubiendo] = useState(null)
  const [errorImagen, setErrorImagen] = useState('')
  // Después de agregar, quitar o mover, el foco va a donde siguió la persona
  const enfocar = useRef(null)

  useEffect(() => {
    if (!enfocar.current) return
    document.getElementById(enfocar.current)?.focus()
    enfocar.current = null
  }, [pasos])

  function cambiar(clave, cambios) {
    onChange(pasos.map((paso) => (paso.clave === clave ? { ...paso, ...cambios } : paso)))
  }

  function agregar() {
    const clave = nuevaClavePaso()
    enfocar.current = `${clave}-texto`
    onChange([...pasos, { clave, texto: '', archivo: null }])
  }

  function quitar(indice) {
    const siguiente = pasos[indice + 1] ?? pasos[indice - 1]
    enfocar.current = siguiente ? `${siguiente.clave}-texto` : 'agregar-paso'
    onChange(pasos.filter((_, posicion) => posicion !== indice))
  }

  function mover(indice, direccion, boton) {
    // El foco acompaña al paso que se movió; si llegó al borde, va al otro botón
    const clave = pasos[indice].clave
    const llegaAlBorde = indice + direccion === 0 || indice + direccion === pasos.length - 1
    enfocar.current = `${clave}-${llegaAlBorde ? (boton === 'subir' ? 'bajar' : 'subir') : boton}`
    onChange(moverPaso(pasos, indice, direccion))
  }

  async function elegirImagen(clave, evento) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    const invalido = validarArchivoAdjunto(archivo) || (esArchivoPdf({ nombreOriginal: archivo.name, tipoMime: archivo.type }) ? 'Para un paso elegí una imagen JPG o PNG.' : '')
    if (invalido) {
      setErrorImagen(invalido)
      return
    }
    setErrorImagen('')
    setSubiendo(clave)
    try {
      cambiar(clave, { archivo: await subirArchivo(proyectoId, archivo) })
    } catch (err) {
      setErrorImagen(err?.message || 'No pudimos subir la imagen. Intentá nuevamente.')
    } finally {
      setSubiendo(null)
    }
  }

  return (
    <fieldset>
      <legend className="mb-1 font-semibold">Pasos de la rutina <span className="font-normal text-texto-suave">Opcional</span></legend>
      <p className="mb-3 text-sm text-texto-suave">Escribí cada paso en el orden en que se hace. Una imagen o pictograma por paso ayuda a anticipar.</p>
      {pasos.length > 0 && (
        <ol className="mb-3 space-y-3">
          {pasos.map((paso, indice) => (
            <li key={paso.clave} className="rounded-md border border-borde bg-fondo/50 p-3">
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-primario text-sm font-bold text-superficie">{indice + 1}</span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${paso.clave}-texto`} className="sr-only">{`Paso ${indice + 1}`}</label>
                  <input
                    id={`${paso.clave}-texto`}
                    value={paso.texto}
                    onChange={(evento) => cambiar(paso.clave, { texto: evento.target.value })}
                    maxLength={LARGO_MAXIMO_PASO}
                    disabled={disabled}
                    placeholder="Ej. Ponerse el guardapolvo"
                    className="min-h-11 w-full rounded-md border border-borde bg-superficie px-3 py-2 focus-visible:outline-2 focus-visible:outline-primario"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    {paso.archivo ? (
                      <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-decoracion px-3 text-secundario">
                        <ImageSquare size={16} aria-hidden="true" />
                        <span className="max-w-48 truncate">{paso.archivo.nombreOriginal}</span>
                        <button type="button" onClick={() => cambiar(paso.clave, { archivo: null })} disabled={disabled} aria-label={`Quitar la imagen del paso ${indice + 1}`} className="rounded-full p-1 hover:bg-superficie focus-visible:outline-2 focus-visible:outline-primario">
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                    ) : (
                      <label className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-borde px-3 text-secundario has-focus-visible:outline-2 has-focus-visible:outline-primario ${disabled || subiendo ? 'opacity-60' : 'hover:bg-decoracion'}`}>
                        <ImageSquare size={16} aria-hidden="true" />
                        {subiendo === paso.clave ? 'Subiendo…' : 'Agregar imagen'}
                        <span className="sr-only">{` al paso ${indice + 1}`}</span>
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(evento) => elegirImagen(paso.clave, evento)} disabled={disabled || Boolean(subiendo)} className="sr-only" />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col sm:flex-row">
                  <button id={`${paso.clave}-subir`} type="button" onClick={() => mover(indice, -1, 'subir')} disabled={disabled || indice === 0} aria-label={`Subir el paso ${indice + 1}`} className={BOTON_ICONO}>
                    <ArrowUp size={18} aria-hidden="true" />
                  </button>
                  <button id={`${paso.clave}-bajar`} type="button" onClick={() => mover(indice, 1, 'bajar')} disabled={disabled || indice === pasos.length - 1} aria-label={`Bajar el paso ${indice + 1}`} className={BOTON_ICONO}>
                    <ArrowDown size={18} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => quitar(indice)} disabled={disabled} aria-label={`Quitar el paso ${indice + 1}`} className={`${BOTON_ICONO} text-error`}>
                    <Trash size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button
        id="agregar-paso"
        type="button"
        onClick={agregar}
        disabled={disabled || pasos.length >= MAXIMO_PASOS}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-contorno-accion px-4 text-sm font-semibold text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} aria-hidden="true" />
        Agregar paso
      </button>
      {(error || errorImagen) && <p role="alert" className="mt-2 text-sm text-error">{error || errorImagen}</p>}
    </fieldset>
  )
}

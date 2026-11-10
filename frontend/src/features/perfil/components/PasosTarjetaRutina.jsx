import { ArrowLeft, ArrowRight, ListNumbers, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { obtenerVistaImagen } from '../../../api/archivos.js'
import useImagenRemota from '../../../hooks/useImagenRemota.js'

function ImagenPaso({ proyectoId, archivo, texto }) {
  const url = useImagenRemota(archivo ? `${proyectoId}:${archivo.id}` : null, () => obtenerVistaImagen(proyectoId, archivo.id))
  if (!archivo) return null
  return (
    <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-decoracion sm:h-80">
      {url
        ? <img src={url} alt={`Imagen del paso: ${texto}`} className="size-full object-contain" />
        : <span className="text-sm text-texto-suave">Cargando imagen…</span>}
    </div>
  )
}

// 2.7: la rutina de a un paso por pantalla, con letra grande, para mirarla junto al niño
function VistaPasoAPaso({ titulo, pasos, proyectoId, onCerrar }) {
  const [actual, setActual] = useState(0)
  const cerrar = useRef(null)
  const alCerrar = useRef(onCerrar)
  const paso = pasos[actual]
  const ultimo = actual === pasos.length - 1

  useEffect(() => {
    alCerrar.current = onCerrar
  }, [onCerrar])

  // Al abrirse, el foco va a cerrar; las flechas del teclado pasan de paso
  useEffect(() => {
    cerrar.current?.focus()
    function alTeclear(evento) {
      if (evento.key === 'Escape') alCerrar.current()
      if (evento.key === 'ArrowRight') setActual((valor) => Math.min(valor + 1, pasos.length - 1))
      if (evento.key === 'ArrowLeft') setActual((valor) => Math.max(valor - 1, 0))
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [pasos.length])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titulo-paso-a-paso" className="fixed inset-0 z-60 flex flex-col bg-fondo p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <h2 id="titulo-paso-a-paso" className="font-display text-h2 text-secundario">{titulo}</h2>
        <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar paso a paso" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-superficie text-primario shadow-sm focus-visible:outline-2 focus-visible:outline-primario">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 overflow-y-auto py-6 text-center">
        <p aria-live="polite" className="text-lg font-semibold text-texto-suave">{`Paso ${actual + 1} de ${pasos.length}`}</p>
        <ImagenPaso key={paso.archivo?.id ?? actual} proyectoId={proyectoId} archivo={paso.archivo} texto={paso.texto} />
        <p className="font-display text-display text-secundario">{paso.texto}</p>
        <ol aria-hidden="true" className="flex gap-2">
          {pasos.map((item, indice) => (
            <li key={`${item.texto}-${indice}`} className={`size-3 rounded-full ${indice === actual ? 'bg-primario' : indice < actual ? 'bg-primario/40' : 'bg-borde'}`} />
          ))}
        </ol>
      </div>
      <div className="mx-auto flex w-full max-w-3xl justify-between gap-4">
        <button type="button" onClick={() => setActual(actual - 1)} disabled={actual === 0} className="inline-flex min-h-14 items-center gap-2 rounded-md border border-contorno-accion px-6 text-subtitulo font-bold text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario disabled:invisible">
          <ArrowLeft size={22} aria-hidden="true" />Anterior
        </button>
        {ultimo ? (
          <button type="button" onClick={onCerrar} className="inline-flex min-h-14 items-center gap-2 rounded-md bg-primario px-6 text-subtitulo font-bold text-superficie hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario">
            Terminamos
          </button>
        ) : (
          <button type="button" onClick={() => setActual(actual + 1)} className="inline-flex min-h-14 items-center gap-2 rounded-md bg-primario px-6 text-subtitulo font-bold text-superficie hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario">
            Siguiente<ArrowRight size={22} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

// En la tarjeta de la rutina: los pasos numerados y el botón para verla paso a paso.
// pasos ya trae el archivo de cada imagen (ver pasosParaEditar).
export default function PasosTarjetaRutina({ titulo, pasos, proyectoId, resumen = false }) {
  const [abierta, setAbierta] = useState(false)
  const disparador = useRef(null)
  if (!pasos.length) return null
  if (resumen) {
    return <p className="mt-1 flex items-center gap-1 text-sm text-texto-suave"><ListNumbers size={16} aria-hidden="true" />{`${pasos.length} ${pasos.length === 1 ? 'paso' : 'pasos'}`}</p>
  }
  return (
    <div className="mt-3 rounded-md bg-fondo/60 p-3">
      <ol className="space-y-1.5">
        {pasos.map((paso, indice) => (
          <li key={paso.clave} className="flex items-start gap-2 text-sm text-texto">
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primario/15 text-xs font-bold text-primario">{indice + 1}</span>
            <span className="pt-0.5">{paso.texto}</span>
          </li>
        ))}
      </ol>
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierta(true)}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-primario px-4 text-sm font-semibold text-superficie hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        <ListNumbers size={18} aria-hidden="true" />
        Ver paso a paso
        <span className="sr-only">{`: ${titulo}`}</span>
      </button>
      {abierta && (
        <VistaPasoAPaso
          titulo={titulo}
          pasos={pasos}
          proyectoId={proyectoId}
          onCerrar={() => {
            setAbierta(false)
            disparador.current?.focus()
          }}
        />
      )}
    </div>
  )
}

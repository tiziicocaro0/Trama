import { useEffect, useSyncExternalStore } from 'react'
import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react'
import { DURACION, cerrarAviso, obtenerAvisos, suscribirAvisos } from './avisosFlotantes.js'

const ESTILOS = {
  aviso: 'border-borde bg-superficie text-texto',
  error: 'border-error bg-error text-superficie',
}

function AvisoFlotante({ aviso }) {
  const esError = aviso.tipo === 'error'
  const Icono = esError ? WarningCircle : CheckCircle

  // Se cierra solo; los errores quedan un poco más para que se puedan leer.
  useEffect(() => {
    const temporizador = setTimeout(() => cerrarAviso(aviso.id), DURACION[aviso.tipo] ?? DURACION.aviso)
    return () => clearTimeout(temporizador)
  }, [aviso.id, aviso.tipo])

  return (
    <div
      role={esError ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 rounded-md border py-3 pl-4 pr-2 text-sm font-semibold shadow-md ${ESTILOS[aviso.tipo] ?? ESTILOS.aviso}`}
    >
      <Icono
        size={20}
        weight="fill"
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${esError ? '' : 'text-exito'}`}
      />
      <p className="min-w-0 flex-1 break-words pt-0.5">{aviso.texto}</p>
      <button
        type="button"
        onClick={() => cerrarAviso(aviso.id)}
        aria-label="Cerrar aviso"
        className="-my-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-texto/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

// Se monta una sola vez (en App). En el celular salen debajo de la campana;
// en pantallas grandes, a su izquierda.
export default function AvisosFlotantes() {
  const avisos = useSyncExternalStore(suscribirAvisos, obtenerAvisos, obtenerAvisos)
  return (
    <div
      aria-label="Avisos"
      className="pointer-events-none fixed left-4 right-4 top-20 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-20 sm:top-4 sm:w-96 print:hidden"
    >
      {avisos.map((aviso) => (
        <AvisoFlotante key={aviso.id} aviso={aviso} />
      ))}
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { Info } from '@phosphor-icons/react'

// Ícono (i) con una aclaración corta. Se abre al pasar el mouse, con el foco del
// teclado o tocándolo en el celular, y se cierra con Escape o tocando afuera.
export default function InfoAyuda({ etiqueta, children }) {
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  const contenedor = useRef(null)

  useEffect(() => {
    if (!abierta) return undefined
    function alTeclear(event) {
      if (event.key === 'Escape') setAbierta(false)
    }
    function alTocarAfuera(event) {
      if (!contenedor.current?.contains(event.target)) setAbierta(false)
    }
    document.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', alTocarAfuera)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', alTocarAfuera)
    }
  }, [abierta])

  return (
    <span
      ref={contenedor}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setAbierta(true)}
      onMouseLeave={() => setAbierta(false)}
    >
      <button
        type="button"
        aria-label={etiqueta}
        aria-expanded={abierta}
        aria-describedby={abierta ? id : undefined}
        onClick={() => setAbierta(true)}
        onFocus={() => setAbierta(true)}
        onBlur={() => setAbierta(false)}
        className="inline-flex size-7 items-center justify-center rounded-full text-secundario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario"
      >
        <Info size={18} aria-hidden="true" />
      </button>
      {abierta && (
        <span
          id={id}
          role="tooltip"
          className="absolute top-full left-1/2 z-30 mt-1 w-64 -translate-x-1/2 rounded-md bg-texto p-3 text-left font-sans text-sm font-normal text-superficie shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  )
}

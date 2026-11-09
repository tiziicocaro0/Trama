import { Check } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'

// Filtro compacto: un botón con solo el ícono que, al tocarlo, despliega sus opciones
// con el estilo de TRAMA (fondo crema, tipografía propia). Un punto marca si está activo.
// opciones: [[valor, etiqueta], …]; el valor vacío ('') es "sin filtro".
export default function MenuFiltro({ etiqueta, Icono, valor, opciones, onCambiar, valorInicial = '' }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const boton = useRef(null)
  const idMenu = useId()
  const activo = valor !== valorInicial
  const elegida = opciones.find(([codigo]) => codigo === valor)?.[1]

  useEffect(() => {
    if (!abierto) return undefined
    function alTocarFuera(evento) {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    function alTeclar(evento) {
      if (evento.key === 'Escape') {
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('mousedown', alTocarFuera)
    document.addEventListener('keydown', alTeclar)
    return () => {
      document.removeEventListener('mousedown', alTocarFuera)
      document.removeEventListener('keydown', alTeclar)
    }
  }, [abierto])

  function elegir(codigo) {
    onCambiar(codigo)
    setAbierto(false)
    boton.current?.focus()
  }

  return (
    <div ref={contenedor} className="relative shrink-0">
      <button
        ref={boton}
        type="button"
        aria-label={elegida && activo ? `${etiqueta}: ${elegida}` : etiqueta}
        title={etiqueta}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        onClick={() => setAbierto((actual) => !actual)}
        className={`relative inline-flex size-11 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none ${activo || abierto ? 'border-primario bg-decoracion text-primario' : 'border-borde bg-superficie text-texto hover:bg-decoracion'}`}
      >
        <Icono size={20} aria-hidden="true" />
        {activo && (
          <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primario" />
        )}
      </button>

      {abierto && (
        <div
          id={idMenu}
          role="group"
          aria-label={etiqueta}
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-lg border border-borde bg-crema p-2 font-sans shadow-md"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-texto-suave">{etiqueta}</p>
          <ul>
            {opciones.map(([codigo, texto]) => {
              const marcada = codigo === valor
              return (
                <li key={codigo}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={marcada}
                    onClick={() => elegir(codigo)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primario motion-reduce:transition-none ${marcada ? 'bg-superficie font-semibold text-primario' : 'text-texto hover:bg-superficie'}`}
                  >
                    {texto}
                    {marcada && <Check size={16} weight="bold" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

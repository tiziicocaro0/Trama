import { Archive, ClockCounterClockwise, DotsThreeVertical, PencilSimple } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'

// Los tres puntitos de una tarjeta: despliegan editar, archivar y ver historial.
// Cada opción aparece solo si corresponde (editar y archivar, solo el autor).
export default function MenuOpcionesAporte({ titulo, sustantivo, alEditar, alArchivar, alVerHistorial, archivando }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const boton = useRef(null)
  const idMenu = useId()

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

  const opciones = [
    alEditar && ['editar', `Editar ${sustantivo}: ${titulo}`, 'Editar', PencilSimple, alEditar],
    alArchivar && ['archivar', `Archivar ${sustantivo}: ${titulo}`, archivando ? 'Archivando…' : 'Archivar', Archive, alArchivar],
    alVerHistorial && ['historial', `Ver historial del ${sustantivo}: ${titulo}`, 'Ver historial', ClockCounterClockwise, alVerHistorial],
  ].filter(Boolean)

  if (!opciones.length) return null
  return (
    <div ref={contenedor} className="relative shrink-0">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-label={`Más opciones: ${titulo}`}
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        className="flex size-10 items-center justify-center rounded-full text-texto-suave transition-colors hover:bg-decoracion hover:text-primario focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none"
      >
        <DotsThreeVertical size={22} weight="bold" aria-hidden="true" />
      </button>

      {abierto && (
        <ul
          id={idMenu}
          className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-borde bg-crema p-1 font-sans shadow-md"
        >
          {opciones.map(([clave, nombre, texto, Icono, accion]) => (
            <li key={clave}>
              <button
                type="button"
                aria-label={nombre}
                disabled={clave !== 'historial' && archivando}
                onClick={() => {
                  setAbierto(false)
                  // El foco vuelve a los tres puntitos al cerrar el panel o el historial
                  accion({ currentTarget: boton.current })
                }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors hover:bg-superficie focus-visible:outline-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${clave === 'archivar' ? 'text-miel' : 'text-texto'}`}
              >
                <Icono size={18} aria-hidden="true" />
                {texto}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// 4.5: el buscador del encabezado del perfil. Lleva a la página de resultados.
// Cerrado es solo la lupa; al tocarla se estira hacia la izquierda para escribir.
// Tocar afuera o Escape lo vuelve a cerrar. alCambiar avisa a la cabecera para
// que achique los datos del niño mientras se escribe.
export default function BuscadorPerfil({ proyectoId, alCambiar }) {
  const [params] = useSearchParams()
  const [texto, setTexto] = useState(() => params.get('q') ?? '')
  const [abierto, setAbierto] = useState(false)
  const formulario = useRef(null)
  const campo = useRef(null)
  const lupa = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    alCambiar?.(abierto)
  }, [abierto, alCambiar])

  useEffect(() => {
    if (!abierto) return undefined
    campo.current?.focus()
    function alTocar(evento) {
      if (!formulario.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alTocar)
    return () => document.removeEventListener('pointerdown', alTocar)
  }, [abierto])

  function buscar(evento) {
    evento.preventDefault()
    const consulta = texto.trim()
    if (!consulta) return
    navigate(`/proyectos/${proyectoId}/buscar?q=${encodeURIComponent(consulta)}`)
  }

  function alTeclear(evento) {
    if (evento.key !== 'Escape') return
    setAbierto(false)
    lupa.current?.focus()
  }

  return (
    <form
      ref={formulario}
      role="search"
      onSubmit={buscar}
      onKeyDown={alTeclear}
      className={`relative h-11 shrink-0 rounded-full border border-borde bg-superficie transition-all duration-300 ease-out motion-reduce:transition-none print:hidden ${abierto ? 'w-full sm:w-72' : 'w-11'}`}
    >
      <button
        ref={lupa}
        type={abierto ? 'submit' : 'button'}
        onClick={abierto ? undefined : () => setAbierto(true)}
        aria-label={abierto ? 'Buscar' : 'Abrir el buscador del perfil'}
        aria-expanded={abierto}
        aria-controls="buscar-en-perfil"
        className="absolute inset-y-0 left-0 flex w-11 items-center justify-center rounded-full text-secundario hover:text-primario focus-visible:outline-2 focus-visible:outline-primario"
      >
        <MagnifyingGlass size={18} aria-hidden="true" />
      </button>
      <label htmlFor="buscar-en-perfil" className="sr-only">Buscar en el perfil</label>
      <input
        ref={campo}
        id="buscar-en-perfil"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        maxLength={200}
        placeholder="Buscar en el perfil…"
        className={`h-full w-full rounded-full bg-transparent pl-10 pr-4 text-sm text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-primario ${abierto ? '' : 'invisible'}`}
      />
    </form>
  )
}

import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// 4.5: el buscador del encabezado del perfil. Lleva a la página de resultados.
export default function BuscadorPerfil({ proyectoId }) {
  const [params] = useSearchParams()
  const [texto, setTexto] = useState(() => params.get('q') ?? '')
  const navigate = useNavigate()

  function buscar(evento) {
    evento.preventDefault()
    const consulta = texto.trim()
    if (!consulta) return
    navigate(`/proyectos/${proyectoId}/buscar?q=${encodeURIComponent(consulta)}`)
  }

  return (
    <form role="search" onSubmit={buscar} className="relative w-full sm:w-56 print:hidden">
      <label htmlFor="buscar-en-perfil" className="sr-only">Buscar en el perfil</label>
      <MagnifyingGlass
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave"
      />
      <input
        id="buscar-en-perfil"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        maxLength={200}
        placeholder="Buscar en el perfil…"
        className="min-h-11 w-full rounded-full border border-borde bg-superficie pl-9 pr-3 text-sm text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-primario"
      />
    </form>
  )
}

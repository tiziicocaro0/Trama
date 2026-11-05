import { Link, useLocation } from 'react-router-dom'

// La vista general del perfil también es un botón, así se vuelve a ella desde cualquier espacio.
const espacios = [
  { slug: '', titulo: 'Vista general' },
  { slug: 'red', titulo: 'Red' },
  { slug: 'datos-personales', titulo: 'Datos personales' },
  { slug: 'notas', titulo: 'Notas' },
]

// Botonera del perfil: queda fija en la cabecera y solo cambia cuál está marcado.
export default function NavegacionPerfil({ proyectoId }) {
  const { pathname } = useLocation()
  const actual = pathname.replace(/\/+$/, '')
  return (
    <nav aria-label="Espacios del perfil" className="flex flex-wrap gap-2 print:hidden">
      {espacios.map(({ slug, titulo }) => {
        const destino = slug ? `/proyectos/${proyectoId}/${slug}` : `/proyectos/${proyectoId}`
        const seleccionado = actual === destino
        return (
          <Link
            key={titulo}
            to={destino}
            aria-current={seleccionado ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none ${seleccionado ? 'border-primario bg-primario text-superficie' : 'border-contorno-accion text-primario hover:bg-decoracion'}`}
          >
            {titulo}
          </Link>
        )
      })}
    </nav>
  )
}

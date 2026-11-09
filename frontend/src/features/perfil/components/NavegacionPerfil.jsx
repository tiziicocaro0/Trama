import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { seccionDesregulacion, seccionesPerfil, seccionNotas } from '../perfil.js'

// Todas las pestañas del perfil en una sola fila: la información general, cada sección
// y los espacios del niño (Red, Datos personales, Recursos).
const pestanas = [
  { slug: '', titulo: 'Información general' },
  ...seccionesPerfil.map(({ slug, titulo }) => ({ slug, titulo })),
  { slug: seccionDesregulacion.slug, titulo: seccionDesregulacion.titulo },
  { slug: seccionNotas.slug, titulo: seccionNotas.titulo },
  { slug: 'red', titulo: 'Red' },
  { slug: 'datos-personales', titulo: 'Datos personales' },
  { slug: 'recursos', titulo: 'Recursos' },
]

// Pestañas subrayadas, fijas en la cabecera: solo cambia cuál está marcada.
// Si la pantalla es angosta, la fila se desplaza de costado.
export default function NavegacionPerfil({ proyectoId }) {
  const { pathname } = useLocation()
  const actual = pathname.replace(/\/+$/, '')
  const marcada = useRef(null)

  // En el celular la fila se desplaza: la pestaña marcada queda siempre a la vista
  useEffect(() => {
    marcada.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [actual])

  return (
    <nav aria-label="Espacios del perfil" className="border-b border-borde print:hidden">
      <ul className="-mb-px flex gap-4 overflow-x-auto">
        {pestanas.map(({ slug, titulo }) => {
          const destino = slug ? `/proyectos/${proyectoId}/${slug}` : `/proyectos/${proyectoId}`
          const seleccionado = actual === destino
          return (
            <li key={titulo} className="shrink-0">
              <Link
                ref={seleccionado ? marcada : undefined}
                to={destino}
                aria-current={seleccionado ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none ${seleccionado ? 'border-primario font-semibold text-primario' : 'border-transparent text-texto hover:text-primario'}`}
              >
                {titulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

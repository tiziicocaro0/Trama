import { useLocation } from 'react-router-dom'
import Boton from '../../../components/ui/Boton.jsx'

// La vista general del perfil también es un botón, así se vuelve a ella desde cualquier espacio.
const espacios = [
  { slug: '', titulo: 'Vista general' },
  { slug: 'red', titulo: 'Red' },
  { slug: 'datos-personales', titulo: 'Datos personales' },
  { slug: 'notas', titulo: 'Notas' },
]

export default function NavegacionPerfil({ proyectoId }) {
  const { pathname } = useLocation()
  const actual = pathname.replace(/\/+$/, '')
  return (
    <nav aria-label="Espacios del perfil" className="mb-6 flex flex-wrap gap-3">
      {espacios.map(({ slug, titulo }) => {
        const destino = slug
          ? `/proyectos/${proyectoId}/${slug}`
          : `/proyectos/${proyectoId}`
        const seleccionado = actual === destino
        return (
          <Boton
            key={titulo}
            to={destino}
            variant={seleccionado ? 'primary' : 'secondary'}
            aria-current={seleccionado ? 'page' : undefined}
          >
            {titulo}
          </Boton>
        )
      })}
    </nav>
  )
}

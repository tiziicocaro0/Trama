import { useLocation } from 'react-router-dom'
import Boton from '../../../components/ui/Boton.jsx'

const espacios = [
  { slug: 'red', titulo: 'Red' },
  { slug: 'datos-personales', titulo: 'Datos personales' },
  { slug: 'notas', titulo: 'Notas' },
]

export default function NavegacionPerfil({ proyectoId }) {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Espacios del perfil" className="mb-6 flex flex-wrap gap-3">
      {espacios.map(({ slug, titulo }) => {
        const destino = `/proyectos/${proyectoId}/${slug}`
        return (
          <Boton
            key={slug}
            to={destino}
            variant="secondary"
            aria-current={pathname === destino ? 'page' : undefined}
          >
            {titulo}
          </Boton>
        )
      })}
    </nav>
  )
}

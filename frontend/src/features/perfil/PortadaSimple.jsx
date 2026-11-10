import { BookOpen, Heart, NotePencil, Sun } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import PerfilPage from './PerfilPage.jsx'
import { usePerfilDelLayout } from './PerfilContext.js'

const CLASE_BOTON = 'flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg p-6 text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none'

// 7.0: la portada del perfil en vista simple. Solo cuatro botones grandes, con textos grandes,
// para usar TRAMA sin ayuda. Cargar una observación son tres pasos: este botón, completar y guardar.
export default function PortadaSimple() {
  const { id } = useParams()
  const proyecto = usePerfilDelLayout()?.proyecto
  const nombre = proyecto?.apodo || proyecto?.nombre || 'el niño'
  const botones = [
    { to: `/proyectos/${id}/conocelo`, Icono: BookOpen, titulo: 'Conocelo en 5 minutos', texto: `Lo más importante de ${nombre}`, tono: 'bg-superficie text-primario' },
    { to: `/proyectos/${id}/desregulacion`, Icono: Heart, titulo: 'Si se desregula', texto: 'Qué ayuda y qué evitar', tono: 'bg-miel/15 text-secundario' },
    { to: `/proyectos/${id}/hoy`, Icono: Sun, titulo: 'Hoy', texto: 'Qué hace hoy, paso a paso', tono: 'bg-agua/15 text-secundario' },
    ...(proyecto?.puedeCargar
      ? [{ to: `/proyectos/${id}/bitacora?nueva=1`, Icono: NotePencil, titulo: 'Cargar observación', texto: 'Contá algo que viste', tono: 'bg-primario text-superficie' }]
      : []),
  ]
  return (
    <main tabIndex={-1} className="mx-auto max-w-4xl px-4 pb-10 text-texto focus:outline-none sm:px-8">
      <h2 className="sr-only">Vista simple</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {botones.map(({ to, Icono, titulo, texto, tono }) => (
          <li key={titulo}>
            <Link to={to} className={`${CLASE_BOTON} ${tono}`}>
              <Icono size={48} aria-hidden="true" />
              <span className="font-display text-h1">{titulo}</span>
              <span className="text-lg">{texto}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-texto-suave">
        Para ver todo el perfil, desactivá la vista simple en <Link to="/perfil" className="font-semibold text-primario underline">Mi perfil</Link>.
      </p>
    </main>
  )
}

// La portada del perfil según la cuenta: la vista simple o la completa
export function PortadaSegunVista() {
  const { usuario } = useAuth()
  return usuario?.vistaSimple ? <PortadaSimple /> : <PerfilPage />
}

import { ArrowLeft, User } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import Logo from '../../../components/ui/Logo.jsx'
import { calcularEdad } from '../perfil.js'
import AvisoPlanGratuito from '../../plan/AvisoPlanGratuito.jsx'

export default function CabeceraPerfil({ proyecto, seccion }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  return (
    <header className="mb-8">
      <div className="mb-4 print:hidden">
        <Link
          to="/inicio"
          aria-label="TRAMA · Inicio"
          className="inline-block w-32 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          <Logo />
        </Link>
      </div>
      <Link
        to={seccion ? `/proyectos/${proyecto.id}` : '/acompanamientos'}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-secundario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario print:hidden"
      >
        <ArrowLeft size={20} aria-hidden="true" className="text-primario" />
        {seccion ? 'Volver al perfil' : 'Volver a acompañamientos'}
      </Link>
      <div className="flex items-center gap-5 sm:gap-6">
        <span
          role="img"
          aria-label={`Foto de ${proyecto.nombre} no disponible`}
          className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primario text-superficie sm:size-24"
        >
          <User size={40} weight="light" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="break-words font-display text-h1 leading-tight text-secundario sm:text-display">
            {proyecto.nombre}
          </h1>
          <p className="mt-2 text-subtitulo">
            {edad === null
              ? 'Edad no disponible'
              : `${edad} ${edad === 1 ? 'año' : 'años'}`}
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Perfil del niño{seccion ? ` · ${seccion.titulo}` : ''}
          </p>
        </div>
      </div>
      {proyecto.soloLecturaPorPlan === true && (
        <div className="mt-6 print:hidden">
          <AvisoPlanGratuito />
        </div>
      )}
    </header>
  )
}

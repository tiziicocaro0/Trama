import { ArrowLeft, Play } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { calcularEdad } from '../perfil.js'
import AvisoPlanGratuito from '../../plan/AvisoPlanGratuito.jsx'
import FotoNinoCabecera from './FotoNinoCabecera.jsx'
import NavegacionPerfil from './NavegacionPerfil.jsx'

// Cabecera del perfil del niño: la dibuja PerfilLayout una sola vez para todas las
// secciones. Foto, nombre y el acceso a Conocelo en una línea; abajo, todas las pestañas.
export default function CabeceraPerfil({ proyecto, seccion, puedeEditarFoto = false, onCambioFoto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  const enConocelo = seccion?.titulo === 'Conocelo en 5 minutos'
  return (
    <header className="mb-6">
      <Link
        to={seccion ? `/proyectos/${proyecto.id}` : '/acompanamientos'}
        className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-secundario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario print:hidden"
      >
        <ArrowLeft size={18} aria-hidden="true" className="text-primario" />
        {seccion ? `Volver al perfil de ${proyecto.nombre}` : 'Volver a acompañamientos'}
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-4">
          <FotoNinoCabecera proyecto={proyecto} editable={puedeEditarFoto} onCambio={onCambioFoto} />
          <div className="min-w-0">
            <h1 className="break-words font-display text-h1 leading-tight text-secundario">
              {proyecto.nombre}
            </h1>
            <p className="text-sm text-texto-suave">
              {edad === null ? 'Edad no disponible' : `${edad} ${edad === 1 ? 'año' : 'años'}`}
              <span className="sr-only">{`. Perfil del niño${seccion ? `, ${seccion.titulo}` : ''}`}</span>
            </p>
          </div>
        </div>
        {!enConocelo && (
          <Link
            to={`/proyectos/${proyecto.id}/conocelo`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-decoracion px-4 text-sm font-semibold text-primario transition-colors hover:bg-miel/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none print:hidden"
          >
            <Play size={14} weight="fill" aria-hidden="true" />
            Conocelo en 5 minutos
          </Link>
        )}
      </div>
      <NavegacionPerfil proyectoId={proyecto.id} />
      {proyecto.soloLecturaPorPlan === true && (
        <div className="mt-5 print:hidden">
          <AvisoPlanGratuito />
        </div>
      )}
    </header>
  )
}

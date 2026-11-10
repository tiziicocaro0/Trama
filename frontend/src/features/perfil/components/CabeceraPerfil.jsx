import { ArrowLeft } from '@phosphor-icons/react'
import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthContext from '../../auth/AuthContext.js'
import { calcularEdad } from '../perfil.js'
import AvisoPlanGratuito from '../../plan/AvisoPlanGratuito.jsx'
import BuscadorPerfil from './BuscadorPerfil.jsx'
import DatosRapidosNino from './DatosRapidosNino.jsx'
import FotoNinoCabecera from './FotoNinoCabecera.jsx'
import NavegacionPerfil from './NavegacionPerfil.jsx'

// Cabecera del perfil del niño: la dibuja PerfilLayout una sola vez para todas las
// secciones. Arriba, volver; después foto, nombre y edad, una línea divisoria, los datos
// básicos y la lupa a la derecha (en el celular la lupa va al lado del nombre y los datos
// abajo). Abajo de todo, las pestañas. Conocelo se abre desde Información general.
export default function CabeceraPerfil({ proyecto, seccion, puedeEditarFoto = false, onCambioFoto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  // Mientras el buscador está abierto, los datos del niño quedan solo con sus íconos
  const [buscando, setBuscando] = useState(false)
  // 7.0: en la vista simple no van las pestañas ni el buscador, solo los botones grandes
  const vistaSimple = Boolean(useContext(AuthContext)?.usuario?.vistaSimple)
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
        <div className="flex min-w-0 flex-1 items-center gap-4 md:flex-none">
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
        <div aria-hidden="true" className="hidden h-14 w-px bg-borde md:block" />
        {/* En el celular los datos bajan a su propia fila; desde md quedan entre el nombre y la lupa */}
        <div className="order-last basis-full md:order-none md:basis-auto md:flex-1">
          <DatosRapidosNino proyecto={proyecto} compacto={buscando} />
        </div>
        {!vistaSimple && (
          <div className={`flex justify-end md:order-last ${buscando ? 'basis-full sm:basis-auto' : ''}`}>
            <BuscadorPerfil key={proyecto.id} proyectoId={proyecto.id} alCambiar={setBuscando} />
          </div>
        )}
      </div>
      {!vistaSimple && <NavegacionPerfil proyectoId={proyecto.id} />}
      {proyecto.soloLecturaPorPlan === true && (
        <div className="mt-5 print:hidden">
          <AvisoPlanGratuito />
        </div>
      )}
    </header>
  )
}

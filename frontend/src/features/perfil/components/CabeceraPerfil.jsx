import { ArrowLeft } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Campo from '../../../components/ui/Campo.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import { calcularEdad } from '../perfil.js'
import AvisoPlanGratuito from '../../plan/AvisoPlanGratuito.jsx'
import FotoNinoCabecera from './FotoNinoCabecera.jsx'
import NavegacionPerfil from './NavegacionPerfil.jsx'

// Cabecera del perfil del niño: la dibuja PerfilLayout una sola vez para todas las
// secciones. Foto y nombre a la izquierda, la botonera a la derecha.
export default function CabeceraPerfil({ proyecto, seccion, puedeEditarFoto = false, onCambioFoto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()
  function buscar(evento) {
    evento.preventDefault()
    const texto = busqueda.trim().replace(/\s+/g, ' ')
    if (texto) navigate(`/proyectos/${proyecto.id}/buscar?${new URLSearchParams({ q: texto })}`)
  }
  return (
    <header className="mb-6">
      <Link
        to={seccion ? `/proyectos/${proyecto.id}` : '/acompanamientos'}
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-secundario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario print:hidden"
      >
        <ArrowLeft size={18} aria-hidden="true" className="text-primario" />
        {seccion ? 'Volver al perfil' : 'Volver a acompañamientos'}
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <FotoNinoCabecera proyecto={proyecto} editable={puedeEditarFoto} onCambio={onCambioFoto} />
          <div className="min-w-0">
            <h1 className="break-words font-display text-h1 leading-tight text-secundario">
              {proyecto.nombre}
            </h1>
            <p className="text-texto">
              {edad === null ? 'Edad no disponible' : `${edad} ${edad === 1 ? 'año' : 'años'}`}
            </p>
            <p className="text-sm text-texto-suave">
              Perfil del niño{seccion ? ` · ${seccion.titulo}` : ''}
            </p>
          </div>
        </div>
        <NavegacionPerfil proyectoId={proyecto.id} />
      </div>
      <form role="search" onSubmit={buscar} className="mt-4 flex flex-wrap items-end gap-3 print:hidden">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-sm font-semibold text-texto">Buscar aportes</span>
          <Campo type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} maxLength={200} placeholder="Buscar por palabra o frase" />
        </label>
        <Boton type="submit">Buscar</Boton>
      </form>
      {proyecto.soloLecturaPorPlan === true && (
        <div className="mt-5 print:hidden">
          <AvisoPlanGratuito />
        </div>
      )}
    </header>
  )
}

import { CalendarBlank, CaretRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { calcularEdad } from '../../perfil/perfil.js'
import FotoNino from '../../perfil/components/FotoNino.jsx'

export default function TarjetaProyecto({ proyecto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-lg bg-superficie p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <Link
      to={`/proyectos/${proyecto.id}`}
      aria-label={`Ver perfil de ${proyecto.nombre}`}
      className="flex min-w-0 flex-1 items-center gap-4 rounded-md p-1 transition-colors hover:bg-bienvenida-luz focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none sm:gap-6"
    >
      <FotoNino
        proyecto={proyecto}
        className="size-16 sm:size-24"
        claseIcono="bg-primario text-superficie"
        tamanoIcono={40}
      />
      <div className="min-w-0 flex-1">
        <h2 className="break-words font-display text-h2 text-secundario sm:text-h1">
          {proyecto.nombre}
        </h2>
        <p className="mt-2 text-base sm:text-subtitulo">
          {edad === null
            ? 'Edad no disponible'
            : `${edad} ${edad === 1 ? 'año' : 'años'}`}
        </p>
      </div>
      <CaretRight
        size={24}
        aria-hidden="true"
        className="shrink-0 text-primario"
      />
      </Link>
      <Link
        to={`/proyectos/${proyecto.id}/calendario`}
        aria-label={`Ver calendario de ${proyecto.nombre}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-contorno-accion px-4 font-semibold text-primario hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        <CalendarBlank size={20} aria-hidden="true" />
        Calendario
      </Link>
    </article>
  )
}

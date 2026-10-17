import { CaretRight, User } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { calcularEdad } from '../../perfil/perfil.js'

export default function TarjetaProyecto({ proyecto }) {
  const edad = calcularEdad(proyecto.fechaNacimiento)
  return (
    <Link
      to={`/proyectos/${proyecto.id}`}
      aria-label={`Ver perfil de ${proyecto.nombre}`}
      className="flex min-w-0 items-center gap-4 rounded-lg bg-superficie p-5 shadow-sm transition-colors hover:bg-bienvenida-luz focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none sm:gap-6 sm:p-6"
    >
      <span
        role="img"
        aria-label={`Foto de ${proyecto.nombre} no disponible`}
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primario text-superficie sm:size-24"
      >
        <User size={40} weight="light" aria-hidden="true" />
      </span>
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
  )
}

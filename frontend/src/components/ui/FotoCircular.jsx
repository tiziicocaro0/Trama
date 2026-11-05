import { User } from '@phosphor-icons/react'

// Foto redonda de una persona o de un niño. Sin foto, muestra el ícono de siempre.
export default function FotoCircular({ src, nombre, className = 'size-12', claseIcono = 'text-secundario bg-decoracion', tamanoIcono = 24 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Foto de ${nombre}`}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={`Foto de ${nombre} no disponible`}
      className={`flex shrink-0 items-center justify-center rounded-full ${claseIcono} ${className}`}
    >
      <User size={tamanoIcono} weight="light" aria-hidden="true" />
    </span>
  )
}

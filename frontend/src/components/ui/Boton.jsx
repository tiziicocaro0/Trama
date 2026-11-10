import { Link } from 'react-router-dom'

// "chico" es para las acciones de las páginas (agregar, descargar, abrir un resumen),
// que no necesitan el tamaño de un botón de formulario.
const tamanos = {
  normal: 'min-h-14 px-6 py-3 text-subtitulo font-bold',
  chico: 'min-h-11 px-4 py-2 text-sm font-semibold',
}

const variants = {
  primary:
    'bg-primario text-superficie border-primario hover:bg-primario-hover hover:border-primario-hover',
  secondary:
    'bg-transparent text-primario border-contorno-accion hover:bg-decoracion',
  danger:
    'bg-error text-superficie border-error hover:opacity-90',
}

export default function Boton({
  to,
  variant = 'primary',
  tamano = 'normal',
  className = '',
  children,
  disabled = false,
  type = 'button',
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md border font-sans transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto disabled:border-borde motion-reduce:transition-none ${tamanos[tamano]} ${variants[variant]} ${className}`

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  )
}

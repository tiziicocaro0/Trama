import { Link } from 'react-router-dom'

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
  className = '',
  children,
  disabled = false,
  type = 'button',
  ...props
}) {
  const classes = `inline-flex min-h-14 items-center justify-center gap-2 rounded-md border px-6 py-3 font-sans text-subtitulo font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto disabled:border-borde motion-reduce:transition-none ${variants[variant]} ${className}`

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

import { CaretDown } from '@phosphor-icons/react'

// Desplegable con la misma estética que Campo (mismo alto, borde, ícono y foco).
export default function CampoSelector({
  icon: Icon,
  opciones,
  className = '',
  ...props
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-agua"
        />
      )}
      <select
        {...props}
        className={`min-h-18 w-full cursor-pointer appearance-none rounded-md border bg-superficie py-4 pr-14 text-lg text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-wait ${Icon ? 'pl-14' : 'pl-5'} ${props['aria-invalid'] ? 'border-error' : 'border-borde'} ${className}`}
      >
        {opciones.map(({ valor, etiqueta }) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
      <CaretDown
        size={20}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-primario"
      />
    </div>
  )
}

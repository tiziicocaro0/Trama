export default function Input({
  icon: Icon,
  endAdornment,
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
      <input
        {...props}
        className={`min-h-18 w-full rounded-md border bg-superficie py-4 text-lg text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-wait ${endAdornment ? 'pr-16' : 'pr-5'} ${Icon ? 'pl-14' : 'pl-5'} ${props['aria-invalid'] ? 'border-error' : 'border-borde'} ${className}`}
      />
      {endAdornment && (
        <span className="absolute top-1/2 right-2 -translate-y-1/2">
          {endAdornment}
        </span>
      )}
    </div>
  )
}

import Ovillo from './Ovillo.jsx'

// Casilla de TRAMA: al marcarla aparece el ovillo de lana, rodando.
// Usa un checkbox nativo (invisible) para que funcione con teclado, lectores de pantalla y formularios.
// tamano="chico": ovillo más chico y sin forma propia, para usar dentro de una pastilla (la forma la da className).
export default function CasillaOvillo({
  checked,
  onChange,
  disabled = false,
  name,
  value,
  required,
  describedBy,
  invalida = false,
  children,
  className = '',
  tamano = 'normal',
}) {
  const chico = tamano === 'chico'
  const forma = chico
    ? 'inline-flex gap-2'
    : 'flex min-h-11 gap-3 rounded-md px-2 py-1'
  const medida = chico ? 'size-5' : 'size-7'

  return (
    <label
      className={`group ${forma} cursor-pointer items-center has-focus-visible:outline-2 has-focus-visible:outline-primario has-disabled:cursor-not-allowed ${className}`.trim()}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
        required={required}
        aria-invalid={invalida || undefined}
        aria-describedby={describedBy}
      />
      <span
        aria-hidden="true"
        className={`relative flex ${medida} shrink-0 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none group-hover:border-primario ${checked ? 'border-transparent' : invalida ? 'border-error bg-superficie' : 'border-borde bg-superficie'}`}
      >
        {/* al marcarla, el ovillo entra rodando: crece y gira hasta quedar en su lugar */}
        <Ovillo
          className={`absolute -inset-0.5 transition duration-300 ease-out motion-reduce:transition-none ${checked ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-180 opacity-0'}`}
        />
      </span>
      <span className="min-w-0 text-texto">{children}</span>
    </label>
  )
}

export default function RadioOvillo({
  checked,
  onChange,
  disabled = false,
  name,
  value,
  children,
  descripcion,
}) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primario ${
        checked
          ? 'border-primario bg-primario/5'
          : 'border-borde bg-superficie hover:border-primario/40'
      }`}
    >
      <input
        type="radio"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
      />

      <span
        aria-hidden="true"
        className={`relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none group-hover:border-primario ${
          checked
            ? 'border-transparent'
            : 'border-borde bg-superficie'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`size-7 text-primario transition-opacity duration-200 motion-reduce:transition-none ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <circle
            cx="11"
            cy="11.5"
            r="8"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={checked ? 0 : 1}
            className="fill-primario/15 transition-all duration-500 ease-out motion-reduce:transition-none"
          />

          {[
            'M4.6 7.2c4.2-.4 9.4 1.9 12.6 6.6',
            'M3.4 11.2c4.6-.3 9.8 2.4 12 7',
            'M5.3 15.9c3.1-.1 6.2 1.4 7.9 3.4',
            'M8.6 3.9c3.8 1.6 7 5 8.3 9',
            'M14.6 4.4c-2.9 2.7-4.4 6.6-4.1 10.9',
            'M16.8 16.9c1.4.8 2.6 2.2 3.7 4.6',
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={checked ? 0 : 1}
              className={`transition-all duration-300 ease-out motion-reduce:transition-none ${
                [
                  'delay-100',
                  'delay-150',
                  'delay-200',
                  'delay-300',
                  'delay-500',
                  'delay-700',
                ][i]
              }`}
            />
          ))}
        </svg>
      </span>

      <div className="min-w-0">
        <p className="font-semibold text-texto">
          {children}
        </p>

        {descripcion && (
          <p className="mt-1 text-sm text-texto-suave">
            {descripcion}
          </p>
        )}
      </div>
    </label>
  )
}
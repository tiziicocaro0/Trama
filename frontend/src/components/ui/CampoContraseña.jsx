import { useId, useState } from 'react';
export function CampoContraseña({
  etiqueta,
  error,
  id,
  className = '',
  ...props
}) {
  const [mostrar, setMostrar] = useState(false);
  const idGenerado = useId();
  const inputId = id ?? idGenerado;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <label htmlFor={inputId} className="text-sm font-semibold text-oliva">
        {etiqueta}
      </label>
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={mostrar ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-2xl border bg-crema/60 py-2.5 pl-4 pr-12 text-base text-oliva placeholder:text-oliva/50 transition ${error ? 'border-terracota' : 'border-oliva/30 focus:border-terracota'} ${className}`.trim()}
          {...props}
        />
        <button
          type="button"
          onClick={() => setMostrar((prev) => !prev)}
          aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-oliva/70 hover:bg-oliva/10 hover:text-oliva"
        >
          {mostrar ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current stroke-2"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current stroke-2"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs font-semibold text-terracota"
        >
          {error}
        </span>
      )}
    </div>
  );
}
export default CampoContraseña;

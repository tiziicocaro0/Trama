import { useId } from 'react';
export function Campo({
  etiqueta,
  ocultarEtiqueta = false,
  iconoIzquierdo,
  error,
  ayuda,
  id,
  className = '',
  ...props
}) {
  const idGenerado = useId();
  const inputId = id ?? idGenerado;
  const errorId = `${inputId}-error`;
  const ayudaId = `${inputId}-ayuda`;
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <label
        htmlFor={inputId}
        className={
          ocultarEtiqueta ? 'sr-only' : 'text-sm font-semibold text-oliva'
        }
      >
        {etiqueta}
      </label>
      <div className="relative flex items-center">
        {iconoIzquierdo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 flex items-center text-agua"
          >
            {iconoIzquierdo}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : ayuda ? ayudaId : undefined}
          className={`w-full rounded-2xl border bg-superficie/70 py-3.5 text-base text-oliva placeholder:text-oliva/55 transition ${iconoIzquierdo ? 'pl-11 pr-4' : 'px-4'} ${error ? 'border-terracota' : 'border-oliva/15 focus:border-terracota/50'} ${className}`.trim()}
          {...props}
        />
      </div>
      {ayuda && !error && (
        <span id={ayudaId} className="text-xs text-oliva/70">
          {ayuda}
        </span>
      )}
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
export default Campo;

import { useId } from 'react';
export function Selector({
  etiqueta,
  opciones,
  error,
  id,
  className = '',
  ...props
}) {
  const idGenerado = useId();
  const selectId = id ?? idGenerado;
  const errorId = `${selectId}-error`;
  return (
    <div className="flex flex-col gap-1.5 font-sans">
      <label htmlFor={selectId} className="text-sm font-semibold text-oliva">
        {etiqueta}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-2xl border bg-crema/60 px-4 py-2.5 text-base text-oliva transition ${error ? 'border-terracota' : 'border-oliva/30 focus:border-terracota'} ${className}`.trim()}
        {...props}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
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
export default Selector;

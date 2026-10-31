// Interruptor de encendido/apagado. Es un checkbox nativo con role="switch":
// funciona con teclado (espacio) y los lectores de pantalla lo anuncian como "activado/desactivado".
export default function Interruptor({
  checked,
  onChange,
  disabled = false,
  etiqueta,
  descripcion,
  id,
}) {
  const idDescripcion = descripcion ? `${id}-descripcion` : undefined
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center justify-between gap-4 has-disabled:cursor-wait"
    >
      <span className="min-w-0">
        <span className="block font-semibold text-texto">{etiqueta}</span>
        {descripcion && (
          <span id={idDescripcion} className="mt-1 block text-sm text-texto-suave">
            {descripcion}
          </span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={idDescripcion}
      />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-borde transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-superficie after:shadow-sm after:transition-transform peer-checked:bg-primario peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primario motion-reduce:transition-none motion-reduce:after:transition-none"
      />
    </label>
  )
}

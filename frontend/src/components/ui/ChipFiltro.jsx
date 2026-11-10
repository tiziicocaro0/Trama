// Chip de categoría: al elegirlo cambia de color (mismo tamaño), así no corre al resto.
export default function ChipFiltro({ activo, etiqueta, Icono, tono, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-semibold transition-colors motion-reduce:transition-none ${
        activo
          ? 'border-primario bg-primario text-superficie'
          : `border-borde hover:border-primario/50 ${tono ?? 'bg-superficie text-secundario'}`
      }`}
    >
      {Icono && <Icono size={20} aria-hidden="true" />}
      {etiqueta}
    </button>
  )
}

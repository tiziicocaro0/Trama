import { X } from '@phosphor-icons/react'

export default function ChipFiltro({
  activo,
  etiqueta,
  Icono,
  tono,
  onClick,
  hoverCruz = 'hover:bg-texto/10',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 font-semibold ${
        tono ?? 'bg-superficie text-secundario'
      } ${activo ? 'border-current' : 'border-borde'}`}
    >
      {Icono && <Icono size={20} aria-hidden="true" />}

      {etiqueta}

      {activo && (
        <span
          aria-hidden="true"
          className={`inline-flex size-7 items-center justify-center rounded-full transition ${hoverCruz}`}
        >
          <X size={16} />
        </span>
      )}
    </button>
  )
}
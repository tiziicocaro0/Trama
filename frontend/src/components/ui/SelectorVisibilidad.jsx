export default function SelectorVisibilidad({ id, value, onChange, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        ¿Quién puede verlo?
      </label>
      <select
        id={id}
        name="visibilidad"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="min-h-14 w-full rounded-control border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        <option value="TODOS">Toda la red</option>
        <option value="SOLO_TUTORES">Solo tutores</option>
        <option value="SOLO_SALUD">Salud y tutores</option>
        <option value="SOLO_EDUCACION">Educación y tutores</option>
      </select>
    </div>
  )
}

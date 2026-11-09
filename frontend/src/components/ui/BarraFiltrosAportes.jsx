import {
  ArrowsDownUp,
  Briefcase,
  Eye,
  MagnifyingGlass,
} from '@phosphor-icons/react'

import {
  ESPECIALIDADES_EDUCACION,
  ESPECIALIDADES_SALUD,
} from '../../features/perfil/especialidades.js'

export default function BarraFiltrosAportes({
  busqueda,
  setBusqueda,
  especialidad,
  setEspecialidad,
  visibilidad,
  setVisibilidad,
  orden,
  setOrden,
  soloMios,
  setSoloMios,
  placeholder = 'Buscar aportes…',
  ariaBusqueda,
  extra,
}) {
  return (
    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto border-b border-borde/50 pb-4">
      <label className="relative block min-w-64 shrink-0">
        <span className="sr-only">{ariaBusqueda ?? placeholder}</span>

        <MagnifyingGlass
          size={20}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave"
        />

        <input
          type="search"
          aria-label={ariaBusqueda ?? placeholder}
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-md border border-borde bg-superficie py-2 pl-10 pr-4 text-sm text-texto focus-visible:outline-2 focus-visible:outline-primario"
        />
      </label>

      <label className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-borde bg-superficie px-3 text-sm text-texto">
        <Briefcase size={18} aria-hidden="true" />
        <span className="sr-only">Especialidad</span>

        <select
          aria-label="Especialidad"
          value={especialidad}
          onChange={(event) => setEspecialidad(event.target.value)}
          className="max-w-32 bg-transparent"
        >
          <option value="">Especialidad</option>

          {[...ESPECIALIDADES_EDUCACION, ...ESPECIALIDADES_SALUD].map(
            ({ valor, etiqueta }) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-borde bg-superficie px-3 text-sm text-texto">
        <Eye size={18} aria-hidden="true" />
        <span className="sr-only">Visibilidad</span>

        <select
          aria-label="Visibilidad"
          value={visibilidad}
          onChange={(event) => setVisibilidad(event.target.value)}
          className="max-w-32 bg-transparent"
        >
          <option value="">Visibilidad</option>
          <option value="TODOS">Toda la red</option>
          <option value="PROFESIONALES">Solo equipo profesional</option>
          <option value="SOLO_TUTORES">Solo tutores</option>
          <option value="SOLO_SALUD">Salud y tutores</option>
          <option value="SOLO_EDUCACION">Educación y tutores</option>
        </select>
      </label>

      <label className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-borde bg-superficie px-3 text-sm text-texto">
        <ArrowsDownUp size={18} aria-hidden="true" />
        <span className="sr-only">Ordenar por fecha</span>

        <select
          aria-label="Ordenar por fecha"
          value={orden}
          onChange={(event) => setOrden(event.target.value)}
          className="max-w-36 bg-transparent"
        >
          <option value="recientes">Más recientes</option>
          <option value="antiguos">Más antiguos</option>
        </select>
      </label>
        {extra}
      <label className="flex min-h-11 shrink-0 items-center gap-3 border-l border-borde px-3">
        <button
          type="button"
          role="switch"
          aria-checked={soloMios}
          onClick={() => setSoloMios(!soloMios)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
            soloMios
              ? 'border-secundario bg-secundario'
              : 'border-texto-suave bg-decoracion'
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-5 rounded-full bg-superficie transition ${
              soloMios ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>

        <span className="text-sm">Solo mis aportes</span>
      </label>
    </div>
  )
}
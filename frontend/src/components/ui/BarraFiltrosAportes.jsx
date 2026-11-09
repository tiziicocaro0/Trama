import {
  ArrowsDownUp,
  Briefcase,
  Eye,
  MagnifyingGlass,
} from '@phosphor-icons/react'

import { AREAS_PROFESIONALES } from '../../features/perfil/especialidades.js'
import MenuFiltro from './MenuFiltro.jsx'

const VISIBILIDADES = [
  ['', 'Todas'],
  ['TODOS', 'Toda la red'],
  ['PROFESIONALES', 'Solo equipo profesional'],
  ['SOLO_TUTORES', 'Solo tutores'],
  ['SOLO_SALUD', 'Salud y tutores'],
  ['SOLO_EDUCACION', 'Educación y tutores'],
]

const ORDENES = [
  ['recientes', 'Más recientes'],
  ['antiguos', 'Más antiguos'],
]

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
  // La búsqueda a la izquierda; los filtros, solo con su ícono, a la derecha.
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-borde/50 pb-4">
      <label className="relative block min-w-56 flex-1">
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

      <div className="ml-auto flex items-center gap-2">
        <MenuFiltro
          etiqueta="Especialidad"
          Icono={Briefcase}
          valor={especialidad}
          opciones={AREAS_PROFESIONALES}
          onCambiar={setEspecialidad}
        />
        <MenuFiltro
          etiqueta="Visibilidad"
          Icono={Eye}
          valor={visibilidad}
          opciones={VISIBILIDADES}
          onCambiar={setVisibilidad}
        />
        <MenuFiltro
          etiqueta="Ordenar por fecha"
          Icono={ArrowsDownUp}
          valor={orden}
          valorInicial="recientes"
          opciones={ORDENES}
          onCambiar={setOrden}
        />
        {extra}
        <label className="flex min-h-11 shrink-0 items-center gap-3 border-l border-borde pl-3">
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
    </div>
  )
}

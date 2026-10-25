import Boton from '../../../components/ui/Boton.jsx'
import {
  CONTEXTOS_OBSERVACION,
  ETIQUETAS_OBSERVACION,
  tieneFiltrosActivos,
} from '../bitacora.js'

export default function BarraFiltrosBitacora({
  filtros,
  miembros = [],
  alCambiarFiltro,
  alLimpiar,
}) {
  const hayFiltros = tieneFiltrosActivos(filtros)

  return (
    <section
      aria-label="Filtros de la bitácora"
      className="mb-6 rounded-lg bg-superficie p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label
            htmlFor="filtro-desde"
            className="mb-1.5 block text-sm font-semibold text-secundario"
          >
            Desde
          </label>
          <input
            id="filtro-desde"
            name="desde"
            type="date"
            value={filtros.desde}
            onChange={(event) => alCambiarFiltro('desde', event.target.value)}
            className="min-h-11 w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          />
        </div>

        <div>
          <label
            htmlFor="filtro-hasta"
            className="mb-1.5 block text-sm font-semibold text-secundario"
          >
            Hasta
          </label>
          <input
            id="filtro-hasta"
            name="hasta"
            type="date"
            value={filtros.hasta}
            onChange={(event) => alCambiarFiltro('hasta', event.target.value)}
            className="min-h-11 w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          />
        </div>

        <div>
          <label
            htmlFor="filtro-contexto"
            className="mb-1.5 block text-sm font-semibold text-secundario"
          >
            Contexto
          </label>
          <select
            id="filtro-contexto"
            name="contexto"
            value={filtros.contexto}
            onChange={(event) =>
              alCambiarFiltro('contexto', event.target.value)
            }
            className="min-h-11 w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            <option value="">Todos los contextos</option>
            {CONTEXTOS_OBSERVACION.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-etiqueta"
            className="mb-1.5 block text-sm font-semibold text-secundario"
          >
            Etiqueta
          </label>
          <select
            id="filtro-etiqueta"
            name="etiqueta"
            value={filtros.etiqueta}
            onChange={(event) =>
              alCambiarFiltro('etiqueta', event.target.value)
            }
            className="min-h-11 w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            <option value="">Todas las etiquetas</option>
            {ETIQUETAS_OBSERVACION.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-autor"
            className="mb-1.5 block text-sm font-semibold text-secundario"
          >
            Autor
          </label>
          <select
            id="filtro-autor"
            name="autorId"
            value={filtros.autorId}
            onChange={(event) => alCambiarFiltro('autorId', event.target.value)}
            className="min-h-11 w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            <option value="">Todos los autores</option>
            {miembros.map((miembro) => {
              const valorAutor = miembro.usuarioId ?? miembro.id
              const nombreAutor = [miembro.nombre, miembro.apellido]
                .filter(Boolean)
                .join(' ')
              return (
                <option key={valorAutor} value={valorAutor}>
                  {nombreAutor}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Boton
          variant="secondary"
          onClick={alLimpiar}
          disabled={!hayFiltros}
        >
          Limpiar filtros
        </Boton>
      </div>
    </section>
  )
}


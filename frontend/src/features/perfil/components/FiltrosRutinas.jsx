import { Plus, SquaresFour, X } from '@phosphor-icons/react'
import { CATEGORIAS_RUTINA, ICONOS_RUTINA, TONOS_RUTINA, claveCategoriaRutina, etiquetaCategoriaRutina } from '../camposAporte.js'
import { leerDatosAporte } from '../perfil.js'
import BarraFiltrosAportes from '../../../components/ui/BarraFiltrosAportes.jsx'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'


export default function FiltrosRutinas({ busqueda, setBusqueda, categoria, setCategoria, especialidad, setEspecialidad, visibilidad, setVisibilidad, orden, setOrden, soloMios, setSoloMios, alAgregar, puedeCrear, aportes = [] }) {
  const categoriasPersonalizadas = [...new Map(aportes.flatMap((aporte) => {
    const datos = leerDatosAporte(aporte.datos)
    if (datos.categoria !== 'PERSONALIZADA' || !datos.categoriaNombre?.trim()) return []
    return [[claveCategoriaRutina(datos), { valor: claveCategoriaRutina(datos), etiqueta: etiquetaCategoriaRutina(datos) }]]
  })).values()]
  return (
  <section aria-label="Buscar y filtrar rutinas" className="mb-5 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex w-full items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 text-secundario">
            Rutinas
          </h1>

          <p className="max-w-2xl text-texto-suave">
            Actividades de la vida diaria que forman parte de la rutina y favorecen su autonomía, participación y bienestar.
          </p>
        </div>

        {puedeCrear && (
          <button
            type="button"
            aria-label="Agregar aporte"
            onClick={alAgregar}
            className="hidden min-h-11 shrink-0 items-center gap-2 rounded-md bg-primario px-4 text-sm font-semibold text-superficie shadow-sm hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario md:inline-flex"
          >
            <Plus size={18} aria-hidden="true" />
            Agregar aporte
          </button>
        )}
      </div>
    </div>
    <BarraFiltrosAportes
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      especialidad={especialidad}
      setEspecialidad={setEspecialidad}
      visibilidad={visibilidad}
      setVisibilidad={setVisibilidad}
      orden={orden}
      setOrden={setOrden}
      soloMios={soloMios}
      setSoloMios={setSoloMios}
      placeholder="Buscar en rutinas…"
      ariaBusqueda="Buscar en rutinas"
    />
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Categorías de rutinas">
      <button type="button" onClick={() => setCategoria('')} aria-pressed={!categoria} className={`min-h-11 shrink-0 rounded-full border px-4 ${!categoria ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-secundario'}`}>Todos</button>
      {CATEGORIAS_RUTINA.map(([valor, etiqueta]) => { const Icono = ICONOS_RUTINA[valor]; const activa = categoria === valor; return <button key={valor} type="button" onClick={() => setCategoria(activa ? '' : valor)} aria-pressed={activa} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 ${TONOS_RUTINA[valor]} ${activa ? 'border-current' : 'border-borde'}`}><Icono size={18} aria-hidden="true" />{etiqueta}{activa && <X size={16} aria-hidden="true" />}</button> })}
      {categoriasPersonalizadas.map(({ valor, etiqueta }) => <button key={valor} type="button" onClick={() => setCategoria(categoria === valor ? '' : valor)} aria-pressed={categoria === valor} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 ${categoria === valor ? 'border-secundario bg-secundario/15 text-secundario' : 'border-borde bg-superficie text-secundario'}`}><SquaresFour size={18} aria-hidden="true" />{etiqueta}{categoria === valor && <X size={16} aria-hidden="true" />}</button>)}
      {puedeCrear && <button type="button" aria-label="Crear categoría de filtro" onClick={alAgregar} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-dashed border-primario bg-superficie px-4 text-primario"><Plus size={18} aria-hidden="true" />Nueva categoría</button>}
    </div>
  </section>
)}

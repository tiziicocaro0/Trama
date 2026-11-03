import { ArrowsDownUp, Briefcase, Eye, FunnelSimple, MagnifyingGlass, Plus, SquaresFour, X } from '@phosphor-icons/react'
import { CATEGORIAS_RUTINA, ICONOS_RUTINA, TONOS_RUTINA, claveCategoriaRutina, etiquetaCategoriaRutina } from '../camposAporte.js'
import { leerDatosAporte } from '../perfil.js'
import { ESPECIALIDADES_EDUCACION, ESPECIALIDADES_SALUD } from '../especialidades.js'

const clasesControl = 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-borde bg-superficie px-3 text-texto focus-visible:outline-2 focus-visible:outline-primario'

export default function FiltrosRutinas({ busqueda, setBusqueda, categoria, setCategoria, especialidad, setEspecialidad, visibilidad, setVisibilidad, orden, setOrden, soloMios, setSoloMios, filtrosAbiertos, setFiltrosAbiertos, alAgregar, puedeCrear, aportes = [] }) {
  const categoriasPersonalizadas = [...new Map(aportes.flatMap((aporte) => {
    const datos = leerDatosAporte(aporte.datos)
    if (datos.categoria !== 'PERSONALIZADA' || !datos.categoriaNombre?.trim()) return []
    return [[claveCategoriaRutina(datos), { valor: claveCategoriaRutina(datos), etiqueta: etiquetaCategoriaRutina(datos) }]]
  })).values()]
  return <section aria-label="Buscar y filtrar rutinas" className="mb-5 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex w-full items-start justify-between gap-4"><div><h1 className="font-display text-h1 text-secundario">Rutinas</h1><p className="max-w-2xl text-texto-suave">Actividades de la vida diaria que forman parte de la rutina y favorecen su autonomía, participación y bienestar.</p></div>{puedeCrear && <button type="button" aria-label="Agregar aporte en escritorio" onClick={alAgregar} className="hidden min-h-14 shrink-0 items-center gap-2 rounded-md bg-primario px-5 font-semibold text-superficie shadow-sm hover:bg-primario/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario md:inline-flex"><Plus size={20} aria-hidden="true" />Agregar aporte</button>}</div>
    </div>
    <label className="relative block md:max-w-sm">
      <span className="sr-only">Buscar en rutinas</span><MagnifyingGlass size={20} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave" />
      <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en rutinas…" className="min-h-11 w-full rounded-md border border-borde bg-superficie py-2 pl-10 pr-4 text-texto focus-visible:outline-2 focus-visible:outline-primario" />
    </label>
    <div className="flex gap-2 overflow-x-auto border-b border-borde/50 pb-4 md:flex-wrap md:overflow-visible">
      <label className={clasesControl}><Briefcase size={18} aria-hidden="true" /><span className="sr-only">Especialidad</span><select aria-label="Especialidad" value={especialidad} onChange={(event) => setEspecialidad(event.target.value)} className="max-w-40 bg-transparent"><option value="">Especialidad</option>{[...ESPECIALIDADES_EDUCACION, ...ESPECIALIDADES_SALUD].map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}</select></label>
      <label className={clasesControl}><Eye size={18} aria-hidden="true" /><span className="sr-only">Visibilidad</span><select aria-label="Visibilidad" value={visibilidad} onChange={(event) => setVisibilidad(event.target.value)} className="max-w-40 bg-transparent"><option value="">Visibilidad</option><option value="TODOS">Toda la red</option><option value="PROFESIONALES">Solo equipo profesional</option><option value="SOLO_TUTORES">Solo tutores</option><option value="SOLO_SALUD">Salud y tutores</option><option value="SOLO_EDUCACION">Educación y tutores</option></select></label>
      <label className={clasesControl}><ArrowsDownUp size={18} aria-hidden="true" /><span className="sr-only">Ordenar por fecha</span><select aria-label="Ordenar por fecha" value={orden} onChange={(event) => setOrden(event.target.value)} className="bg-transparent"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option></select></label>
      <button type="button" onClick={() => setFiltrosAbiertos(true)} className={`${clasesControl} md:hidden`}><FunnelSimple size={18} aria-hidden="true" />Filtros{soloMios ? ' (1)' : ''}</button>
      <label className="hidden min-h-11 items-center gap-2 border-l border-borde px-3 md:flex"><input type="checkbox" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)} />Solo mis aportes</label>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Categorías de rutinas">
      <button type="button" onClick={() => setCategoria('')} aria-pressed={!categoria} className={`min-h-11 shrink-0 rounded-full border px-4 ${!categoria ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-secundario'}`}>Todos</button>
      {CATEGORIAS_RUTINA.map(([valor, etiqueta]) => { const Icono = ICONOS_RUTINA[valor]; const activa = categoria === valor; return <button key={valor} type="button" onClick={() => setCategoria(activa ? '' : valor)} aria-pressed={activa} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 ${TONOS_RUTINA[valor]} ${activa ? 'border-current' : 'border-borde'}`}><Icono size={18} aria-hidden="true" />{etiqueta}{activa && <X size={16} aria-hidden="true" />}</button> })}
      {categoriasPersonalizadas.map(({ valor, etiqueta }) => <button key={valor} type="button" onClick={() => setCategoria(categoria === valor ? '' : valor)} aria-pressed={categoria === valor} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 ${categoria === valor ? 'border-secundario bg-secundario/15 text-secundario' : 'border-borde bg-superficie text-secundario'}`}><SquaresFour size={18} aria-hidden="true" />{etiqueta}{categoria === valor && <X size={16} aria-hidden="true" />}</button>)}
      {puedeCrear && <button type="button" aria-label="Crear categoría de filtro" onClick={alAgregar} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-dashed border-primario bg-superficie px-4 text-primario"><Plus size={18} aria-hidden="true" />Nueva categoría</button>}
    </div>
    {filtrosAbiertos && <div className="fixed inset-0 z-50 flex items-end bg-texto/40 md:hidden"><div role="dialog" aria-modal="true" aria-label="Filtros de rutinas" className="w-full rounded-t-lg bg-superficie p-6"><div className="mb-5 flex items-center justify-between border-b border-borde pb-3"><h2 className="font-display text-h2">Filtros</h2><button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="flex min-h-11 min-w-11 items-center justify-center"><X size={24} aria-hidden="true" /></button></div><label className="flex min-h-11 items-center gap-3 font-semibold text-secundario"><input type="checkbox" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)} />Solo mis aportes</label><p className="mt-2 text-sm text-texto-suave">Muestra solo los aportes que cargaste vos.</p></div></div>}
  </section>
}

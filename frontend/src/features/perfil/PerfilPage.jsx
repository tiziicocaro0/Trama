import { Heart, Sparkle } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import Boton from '../../components/ui/Boton.jsx'
import CasillaOvillo from '../../components/ui/CasillaOvillo.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import BloquePerfil from './components/BloquePerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import { LEYENDA_NOTAS, seccionesPerfil, seccionNotas } from './perfil.js'
import { listarAportes } from '../../api/aportes.js'
import useAuth from '../../hooks/useAuth.js'
import { leerDatosAporte } from './perfil.js'
import { CATEGORIAS_COMUNICACION, CATEGORIAS_RUTINA, CONTEXTOS_RUTINA, claveCategoriaRutina } from './camposAporte.js'
import { CATEGORIAS_SENSORIALES, ICONOS_SENSORIALES, CATEGORIAS_ESTRATEGIA, ICONOS_ESTRATEGIA, RESULTADOS_ESTRATEGIA, TONOS_ESTRATEGIA } from './camposAporte.js'
import { ESPECIALIDADES_EDUCACION, ESPECIALIDADES_SALUD } from './especialidades.js'
import FiltrosRutinas from './components/FiltrosRutinas.jsx'
import AvisoEliminacion from './eliminacion/AvisoEliminacion.jsx'
import useProyectoActual from '../../hooks/useProyectoActual.js'
import Cargando from '../../components/ui/Cargando.jsx'


export default function PerfilPage() {
  const { id, seccion: slug } = useParams()
  const { proyecto, datos, error, cargando, reintentar } = usePerfil(
    id,
    listarAportes,
  )
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  // 8.2: aviso de eliminación programada en la portada (se oculta al cancelarla)
  const { esAdmin } = useProyectoActual()
  const [cancelacionEn, setCancelacionEn] = useState(null)
  const { usuario } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [visibilidad, setVisibilidad] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [listaSensorial, setListaSensorial] = useState('')
  const [resultadoEstrategia, setResultadoEstrategia] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [soloMios, setSoloMios] = useState(false)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const seccion =
    slug === seccionNotas.slug
      ? seccionNotas
      : seccionesPerfil.find((item) => item.slug === slug || (slug === 'perfil-sensorial' && item.tipo === 'SENSORIAL'))
  const esComunicacion = seccion?.tipo === 'COMUNICACION'
  const esSensorial = seccion?.tipo === 'SENSORIAL'
  const esEstrategia = seccion?.tipo === 'ESTRATEGIA'
  const esRutina = seccion?.tipo === 'RUTINA'
  const aportesRutina = esRutina && datos?.aportes
    ? datos.aportes.filter((aporte) => {
      const datosRutina = leerDatosAporte(aporte.datos)
      return aporte.tipo === 'RUTINA'
        && (!categoria || claveCategoriaRutina(datosRutina) === categoria)
        && (!visibilidad || aporte.visibilidad === visibilidad)
        && (!especialidad || aporte.autorEspecialidades?.some((item) => item.especialidad === especialidad))
        && (!soloMios || aporte.autorId === usuario?.id)
        && (!busqueda.trim() || [aporte.titulo, aporte.contenido, CATEGORIAS_RUTINA.find(([valor]) => valor === datosRutina.categoria)?.[1], ...(datosRutina.contextos ?? []).map((valor) => CONTEXTOS_RUTINA.find(([codigo]) => codigo === valor)?.[1]), ...Object.values(datosRutina)].flat().join(' ').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es')))
    }).sort((a, b) => orden === 'recientes' ? new Date(b.creadoEn) - new Date(a.creadoEn) : new Date(a.creadoEn) - new Date(b.creadoEn))
    : null
  const aportesEstrategia = esEstrategia && datos?.aportes
    ? datos.aportes.filter((aporte) => aporte.tipo === 'ESTRATEGIA'
      && (!categoria || leerDatosAporte(aporte.datos).categoria === categoria)
      && (!resultadoEstrategia || leerDatosAporte(aporte.datos).resultado === resultadoEstrategia)
      && (!visibilidad || aporte.visibilidad === visibilidad)
      && (!especialidad || aporte.autorEspecialidades?.some((item) => item.especialidad === especialidad))
      && (!soloMios || aporte.autorId === usuario?.id)
      && (!busqueda.trim() || [aporte.titulo, aporte.contenido, ...Object.values(leerDatosAporte(aporte.datos))]
        .join(' ').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))))
      .sort((a, b) => orden === 'recientes'
        ? new Date(b.creadoEn) - new Date(a.creadoEn)
        : new Date(a.creadoEn) - new Date(b.creadoEn))
    : null
  const aportesSensoriales = esSensorial && datos?.aportes
    ? datos.aportes.filter((aporte) => aporte.tipo === 'SENSORIAL'
      && (!categoria || leerDatosAporte(aporte.datos).categoria === categoria)
      && (!listaSensorial || leerDatosAporte(aporte.datos).lista === listaSensorial)
      && (!visibilidad || aporte.visibilidad === visibilidad)
      && (!especialidad || aporte.autorEspecialidades?.some((item) => item.especialidad === especialidad))
      && (!soloMios || aporte.autorId === usuario?.id)
      && (!busqueda.trim() || [aporte.titulo, aporte.contenido, ...Object.values(leerDatosAporte(aporte.datos))]
        .join(' ').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))))
      .sort((a, b) => orden === 'recientes'
        ? new Date(b.creadoEn) - new Date(a.creadoEn)
        : new Date(a.creadoEn) - new Date(b.creadoEn))
    : null
  const aportesComunicacion = esComunicacion && datos?.aportes
    ? datos.aportes.filter((aporte) => aporte.tipo === 'COMUNICACION'
      && (!categoria || leerDatosAporte(aporte.datos).categoria === categoria)
      && (!visibilidad || aporte.visibilidad === visibilidad)
      && (!soloMios || aporte.autorId === usuario?.id)
      && (!busqueda.trim() || [aporte.titulo, aporte.contenido, ...Object.values(leerDatosAporte(aporte.datos))]
        .join(' ').toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))))
      .sort((a, b) => orden === 'recientes'
        ? new Date(b.creadoEn) - new Date(a.creadoEn)
        : new Date(a.creadoEn) - new Date(b.creadoEn))
    : null
  return (
    <div className="min-h-svh bg-fondo text-texto">
      <a href="#contenido-perfil" className="skip-link">
        Saltar al contenido
      </a>
      <main
        id="contenido-perfil"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 pb-6 sm:px-8 sm:pb-10"
      >
        {slug && !seccion ? (
          <div className="space-y-4">
            <h1 className="font-display text-h1 text-secundario">
              Sección no encontrada
            </h1>
            <Boton to={`/proyectos/${id}`} variant="secondary">
              Volver al perfil
            </Boton>
          </div>
        ) : cargando ? (
          <Cargando mensaje="Cargando el perfil…" />
        ) : error ? (
          <div className="space-y-5 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar el perfil
            </h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={reintentar}>Reintentar</Boton>
              <Boton to="/inicio" variant="secondary">
                Volver al inicio
              </Boton>
            </div>
          </div>
        ) : proyecto ? (
          <>
            {!seccion && cancelacionEn !== id && (
              <AvisoEliminacion proyecto={proyecto} esAdmin={esAdmin} onCancelada={() => setCancelacionEn(id)} />
            )}
            {!seccion && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-primario/30 bg-superficie p-4 shadow-sm sm:p-5">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-primario">
                      <Sparkle size={20} aria-hidden="true" />
                      Resumen rápido del perfil
                    </p>
                    <p className="mt-1 text-sm text-texto-suave">
                      Intereses principales, cómo comunicarse, qué lo ayuda, qué
                      evitar y qué hacer si se desregula en una sola página.
                    </p>
                  </div>
                  <Boton to={`/proyectos/${id}/conocelo`}>
                    Conocelo en 5 minutos
                  </Boton>
                </div>
                <aside
                  aria-label="Si se desregula · Próximamente"
                  className="mb-6 rounded-md border border-borde bg-superficie/70 p-4 sm:p-5"
                >
                  <p className="flex items-center gap-2 font-semibold text-primario">
                    <Heart size={20} aria-hidden="true" />
                    Si se desregula{' '}
                    <span className="ml-auto text-sm font-normal text-texto-suave">
                      Próximamente
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-texto-suave">
                    Este espacio estará disponible más adelante.
                  </p>
                </aside>
              </>
            )}
            {mensajeGuardado && (
              <p role="status" className="mb-4 text-secundario">
                {mensajeGuardado}
              </p>
            )}
            {seccion?.tipo === 'NOTA_PROFESIONAL' && (
              <div className="mb-4 space-y-2">
                <Aviso>{LEYENDA_NOTAS}</Aviso>
                {proyecto.puedeCargarNotas !== true && (
                  <p className="text-sm text-texto-suave">
                    Las notas las cargan los profesionales de educación y salud.
                  </p>
                )}
              </div>
            )}
            {proyecto.puedeCargar !== true &&
              proyecto.soloLecturaPorPlan !== true && (
              <p className="mb-4 text-sm text-texto-suave">
                Podés consultar este perfil en modo de solo lectura.
              </p>
            )}
            {esComunicacion && (
              <section aria-label="Buscar y filtrar aportes de comunicación" className="mb-5 space-y-4">
                <div>
                  <p className="font-display text-h1 text-secundario">Comunicación</p>
                  <p className="text-texto-suave">Cómo comprende, expresa lo que necesita y se comunica mejor en distintos contextos.</p>
                </div>
                <label className="block">
                  <span className="sr-only">Buscar en comunicación</span>
                  <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en comunicación…" className="min-h-11 w-full rounded-md border border-borde bg-superficie px-4 py-2 text-texto focus-visible:outline-2 focus-visible:outline-primario" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <label><span className="sr-only">Visibilidad</span><select aria-label="Visibilidad" value={visibilidad} onChange={(event) => setVisibilidad(event.target.value)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3"><option value="">Toda visibilidad</option><option value="TODOS">Toda la red</option><option value="SOLO_SALUD">Solo salud</option><option value="SOLO_EDUCACION">Solo educación</option><option value="SOLO_TUTORES">Solo tutores</option></select></label>
                  <label><span className="sr-only">Ordenar por fecha</span><select aria-label="Ordenar por fecha" value={orden} onChange={(event) => setOrden(event.target.value)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option></select></label>
                  <button type="button" onClick={() => setFiltrosAbiertos(true)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3">Más filtros</button>
                  <div className="hidden md:flex"><CasillaOvillo checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Categorías de comunicación">
                  {[["", "Todos"], ...CATEGORIAS_COMUNICACION].map(([valor, etiqueta]) => <button key={valor} type="button" onClick={() => setCategoria(valor)} aria-pressed={categoria === valor} className={`min-h-11 rounded-full border px-4 py-2 ${categoria === valor ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-secundario'}`}>{etiqueta}</button>)}
                </div>
                {filtrosAbiertos && <div className="fixed inset-0 z-40 flex items-end bg-texto/40 md:items-center md:justify-center"><div role="dialog" aria-modal="true" aria-label="Filtros" className="w-full rounded-lg bg-superficie p-6 md:max-w-md"><div className="flex items-center justify-between"><h3 className="font-display text-h2">Filtros</h3><button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="min-h-11 px-3">Cerrar</button></div><CasillaOvillo className="mt-5" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div></div>}
              </section>
            )}
            {esSensorial && (
              <section aria-label="Buscar y filtrar aportes sensoriales" className="mb-5 space-y-4">
                <div>
                  <p className="font-display text-h1 text-secundario">Perfil sensorial</p>
                  <p className="text-texto-suave">Cómo responde a distintos estímulos del entorno, qué sensaciones busca o evita y qué lo ayuda a sentirse más cómodo y regulado.</p>
                </div>
                <label className="block"><span className="sr-only">Buscar en perfil sensorial</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en perfil sensorial…" className="min-h-11 w-full rounded-md border border-borde bg-superficie px-4 py-2 text-texto focus-visible:outline-2 focus-visible:outline-primario" /></label>
                <div className="flex gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                  <select aria-label="Especialidad" value={especialidad} onChange={(event) => setEspecialidad(event.target.value)} className="min-h-11 max-w-full shrink-0 rounded-sm border border-borde bg-superficie px-3"><option value="">Todas las especialidades</option>{[...ESPECIALIDADES_EDUCACION, ...ESPECIALIDADES_SALUD].map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}</select>
                  <select aria-label="Visibilidad" value={visibilidad} onChange={(event) => setVisibilidad(event.target.value)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3"><option value="">Toda visibilidad</option><option value="TODOS">Toda la red</option><option value="PROFESIONALES">Solo equipo profesional</option><option value="SOLO_TUTORES">Solo tutores</option><option value="SOLO_SALUD">Salud y tutores</option><option value="SOLO_EDUCACION">Educación y tutores</option></select>
                  <select aria-label="Ordenar por fecha" value={orden} onChange={(event) => setOrden(event.target.value)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option></select>
                  <select aria-label="Lista" value={listaSensorial} onChange={(event) => setListaSensorial(event.target.value)} className="min-h-11 rounded-sm border border-borde bg-superficie px-3"><option value="">Ambas listas</option><option value="AYUDA">Le ayuda</option><option value="CUESTA">Le cuesta</option></select>
                  <button type="button" onClick={() => setFiltrosAbiertos(true)} className="min-h-11 shrink-0 rounded-sm border border-borde bg-superficie px-3 md:hidden">Filtros{soloMios ? ' (1)' : ''}</button>
                  <div className="hidden md:flex"><CasillaOvillo className="whitespace-nowrap" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Categorías sensoriales">
                  {[['', 'Todos'], ...CATEGORIAS_SENSORIALES].map(([valor, etiqueta]) => { const Icono = ICONOS_SENSORIALES[valor]; return <button key={valor} type="button" onClick={() => setCategoria(valor)} aria-pressed={categoria === valor} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 ${categoria === valor ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-secundario'}`}>{Icono && <Icono size={20} aria-hidden="true" />}{etiqueta}</button> })}
                </div>
                {filtrosAbiertos && <div className="fixed inset-0 z-40 flex items-end bg-texto/40 md:items-center md:justify-center"><div role="dialog" aria-modal="true" aria-label="Filtros sensoriales" className="w-full rounded-lg bg-superficie p-6 md:max-w-md"><div className="flex items-center justify-between"><h3 className="font-display text-h2">Filtros</h3><button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="min-h-11 px-3">Cerrar</button></div><CasillaOvillo className="mt-5" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div></div>}
              </section>
            )}
            {esEstrategia && (
              <section aria-label="Buscar y filtrar estrategias" className="mb-5 space-y-4">
                <div><p className="font-display text-h1 text-secundario">Estrategias</p><p className="text-texto-suave">Apoyos y formas de acompañamiento que facilitan la comprensión, la participación y la autonomía en distintos contextos.</p></div>
                <label className="block"><span className="sr-only">Buscar en estrategias</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en estrategias…" className="min-h-11 w-full rounded-md border border-borde bg-superficie px-4 py-2 text-texto focus-visible:outline-2 focus-visible:outline-primario" /></label>
                <div className="flex gap-3 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                  <select aria-label="Especialidad" value={especialidad} onChange={(event) => setEspecialidad(event.target.value)} className="min-h-11 max-w-full shrink-0 rounded-sm border border-borde bg-superficie px-3"><option value="">Todas las especialidades</option>{[...ESPECIALIDADES_EDUCACION, ...ESPECIALIDADES_SALUD].map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}</select>
                  <select aria-label="Visibilidad" value={visibilidad} onChange={(event) => setVisibilidad(event.target.value)} className="min-h-11 shrink-0 rounded-sm border border-borde bg-superficie px-3"><option value="">Toda visibilidad</option><option value="TODOS">Toda la red</option><option value="PROFESIONALES">Solo equipo profesional</option><option value="SOLO_TUTORES">Solo tutores</option><option value="SOLO_SALUD">Salud y tutores</option><option value="SOLO_EDUCACION">Educación y tutores</option></select>
                  <select aria-label="Ordenar por fecha" value={orden} onChange={(event) => setOrden(event.target.value)} className="min-h-11 shrink-0 rounded-sm border border-borde bg-superficie px-3"><option value="recientes">Más recientes</option><option value="antiguos">Más antiguos</option></select>
                  <select aria-label="Resultado" value={resultadoEstrategia} onChange={(event) => setResultadoEstrategia(event.target.value)} className="min-h-11 shrink-0 rounded-sm border border-borde bg-superficie px-3"><option value="">Todos los resultados</option>{RESULTADOS_ESTRATEGIA.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}</select>
                  <button type="button" onClick={() => setFiltrosAbiertos(true)} className="min-h-11 shrink-0 rounded-sm border border-borde bg-superficie px-3 md:hidden">Filtros{soloMios ? ' (1)' : ''}</button>
                  <div className="hidden md:flex"><CasillaOvillo className="whitespace-nowrap" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" aria-label="Categorías de estrategias">
                  {[['', 'Todos'], ...CATEGORIAS_ESTRATEGIA].map(([valor, etiqueta]) => { const Icono = ICONOS_ESTRATEGIA[valor]; return <button key={valor} type="button" onClick={() => setCategoria(valor)} aria-pressed={categoria === valor} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 ${categoria === valor ? 'border-primario bg-primario text-superficie' : valor ? `border-borde ${TONOS_ESTRATEGIA[valor]}` : 'border-borde bg-superficie text-secundario'}`}>{Icono && <Icono size={20} aria-hidden="true" />}{etiqueta}</button> })}
                </div>
                {filtrosAbiertos && <div className="fixed inset-0 z-40 flex items-end bg-texto/40 md:items-center md:justify-center"><div role="dialog" aria-modal="true" aria-label="Filtros de estrategias" className="w-full rounded-lg bg-superficie p-6 md:max-w-md"><div className="flex items-center justify-between"><h3 className="font-display text-h2">Filtros</h3><button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="min-h-11 px-3">Cerrar</button></div><CasillaOvillo className="mt-5" checked={soloMios} onChange={(event) => setSoloMios(event.target.checked)}>Solo mis aportes</CasillaOvillo></div></div>}
              </section>
            )}
            <div
              className={
                seccion ? 'grid gap-5' : 'grid grid-cols-1 gap-5 md:grid-cols-2'
              }
            >
              {(seccion ? [seccion] : seccionesPerfil).map((item) => (
                <BloquePerfil
                  key={item.slug}
                  seccion={item}
                  aportes={esComunicacion ? aportesComunicacion : esSensorial ? aportesSensoriales : esEstrategia ? aportesEstrategia : esRutina ? aportesRutina : datos.aportes.filter(
                    (aporte) => aporte.tipo === item.tipo,
                  )}
                  proyectoId={id}
                  completo={Boolean(seccion)}
                  encabezado={esRutina ? (alAgregar) => <FiltrosRutinas busqueda={busqueda} setBusqueda={setBusqueda} categoria={categoria} setCategoria={setCategoria} especialidad={especialidad} setEspecialidad={setEspecialidad} visibilidad={visibilidad} setVisibilidad={setVisibilidad} orden={orden} setOrden={setOrden} soloMios={soloMios} setSoloMios={setSoloMios} filtrosAbiertos={filtrosAbiertos} setFiltrosAbiertos={setFiltrosAbiertos} alAgregar={alAgregar} puedeCrear={proyecto.puedeCargar === true} aportes={datos.aportes.filter((aporte) => aporte.tipo === 'RUTINA')} /> : undefined}
                  puedeCrear={
                    item.tipo === 'NOTA_PROFESIONAL'
                      ? proyecto.puedeCargarNotas === true
                      : proyecto.puedeCargar === true
                  }
                  alGuardar={(accion) => {
                    const esNota = item.tipo === 'NOTA_PROFESIONAL'
                    setMensajeGuardado(
                      accion === 'archivado'
                        ? esNota
                          ? 'Nota archivada.'
                          : 'Aporte archivado.'
                        : esNota
                          ? 'Nota guardada.'
                          : 'Aporte guardado.',
                    )
                    reintentar()
                  }}
                />
              ))}
            </div>
            {seccion && (
              <Link
                to={`/proyectos/${id}`}
                className="mt-6 inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                Volver al perfil
              </Link>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

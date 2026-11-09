import { Heart, Plus, Sparkle, X, } from '@phosphor-icons/react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Boton from '../../components/ui/Boton.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import BloquePerfil from './components/BloquePerfil.jsx'
import ProximosCambios from './components/ProximosCambios.jsx'
import BarraFiltrosAportes from '../../components/ui/BarraFiltrosAportes.jsx'
import ChipFiltro from '../../components/ui/ChipFiltro.jsx'
import usePerfil from './hooks/usePerfil.js'
import { LEYENDA_NOTAS, seccionesPerfil, seccionNotas, seccionDesregulacion, } from './perfil.js'
import { listarAportes } from '../../api/aportes.js'
import useAuth from '../../hooks/useAuth.js'
import { leerDatosAporte } from './perfil.js'
import { CATEGORIAS_COMUNICACION, CATEGORIAS_RUTINA, TONOS_COMUNICACION, ICONOS_COMUNICACION, CONTEXTOS_RUTINA, claveCategoriaRutina } from './camposAporte.js'
import { CATEGORIAS_SENSORIALES, ICONOS_SENSORIALES, TONOS_SENSORIALES, CATEGORIAS_ESTRATEGIA, ICONOS_ESTRATEGIA, RESULTADOS_ESTRATEGIA, TONOS_ESTRATEGIA, CATEGORIAS_DESREGULACION, ICONOS_DESREGULACION, TONOS_DESREGULACION, HOVER_CRUZ_DESREGULACION } from './camposAporte.js'
import FiltrosRutinas from './components/FiltrosRutinas.jsx'
import AvisoEliminacion from './eliminacion/AvisoEliminacion.jsx'
import useProyectoActual from '../../hooks/useProyectoActual.js'
import Cargando from '../../components/ui/Cargando.jsx'


export default function PerfilPage() {
  const { id, seccion: slug } = useParams()
  const { hash } = useLocation()
  const { proyecto, datos, error, cargando, reintentar } = usePerfil(
    id,
    listarAportes,
  )
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  // 8.2: aviso de eliminación programada en la portada (se oculta al cancelarla)
  const { esAdmin, rolCodigo, proyectoActual } = useProyectoActual()
  const [cancelacionEn, setCancelacionEn] = useState(null)
  const { usuario } = useAuth()
  useEffect(() => {
    if (!datos?.aportes || !hash.startsWith('#aporte-')) return
    const elemento = document.getElementById(hash.slice(1))
    elemento?.scrollIntoView?.({ block: 'center' })
    elemento?.focus({ preventScroll: true })
  }, [datos, hash, slug])
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [visibilidad, setVisibilidad] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [listaSensorial, setListaSensorial] = useState('')
  const [resultadoEstrategia, setResultadoEstrategia] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [soloMios, setSoloMios] = useState(false)
  const seccion =
    slug === seccionNotas.slug
      ? seccionNotas
      : slug === seccionDesregulacion.slug
        ? seccionDesregulacion
        : seccionesPerfil.find(
            (item) =>
              item.slug === slug ||
              (slug === 'perfil-sensorial' && item.tipo === 'SENSORIAL'),
          )
  const esComunicacion = seccion?.tipo === 'COMUNICACION'
  const esSensorial = seccion?.tipo === 'SENSORIAL'
  const esEstrategia = seccion?.tipo === 'ESTRATEGIA'
  const esRutina = seccion?.tipo === 'RUTINA'
  const esDesregulacion = seccion?.tipo === 'DESREGULACION'
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
  const aportesDesregulacion = esDesregulacion && datos?.aportes
    ? datos.aportes.filter((aporte) => {
          const datosDesregulacion = leerDatosAporte(aporte.datos)
          return aporte.tipo === 'DESREGULACION'
            && (!categoria || datosDesregulacion.lista === categoria)
            && (!visibilidad || aporte.visibilidad === visibilidad)
            && (!especialidad || aporte.autorEspecialidades?.some(
              (item) => item.especialidad === especialidad
            ))
            && (!soloMios || aporte.autorId === usuario?.id)
            && (
              !busqueda.trim() ||
              [
                aporte.titulo,
                aporte.contenido,
                ...Object.values(datosDesregulacion),
              ]
                .join(' ')
                .toLocaleLowerCase('es')
                .includes(busqueda.trim().toLocaleLowerCase('es'))
            )
        })
        .sort((a, b) =>
          orden === 'recientes'
            ? new Date(b.creadoEn) - new Date(a.creadoEn)
            : new Date(a.creadoEn) - new Date(b.creadoEn)
        )
    : null

  function encabezadoConBoton(titulo, descripcion, alAgregar, puedeCrear, textoBoton = 'Agregar aporte',) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        <p className="font-display text-h1 text-secundario">
          {titulo}
        </p>

        {descripcion && (
          <p className="mt-1 text-texto-suave">
            {descripcion}
          </p>
        )}
      </div>

      {puedeCrear && (
        <Boton onClick={alAgregar} className="shrink-0">
          <Plus size={18} aria-hidden="true" />
          {textoBoton}
        </Boton>
      )}
    </div>
  )
}

function encabezadoCompleto({
  titulo,
  descripcion,
  alAgregar,
  puedeCrear,
  filtros,
  categorias,
}) {
  return (
    <div className="mb-5 space-y-4">
      {encabezadoConBoton(
        titulo,
        descripcion,
        alAgregar,
        puedeCrear,
      )}

      {filtros}

      {categorias}
    </div>
  )
}

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
              <div className="mb-6 grid gap-4 lg:grid-cols-12">
                <section className="relative overflow-hidden rounded-lg border border-primario/20 bg-superficie p-5 shadow-sm sm:p-6 lg:col-span-8">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 360 120"
                    className="pointer-events-none absolute right-0 top-0 hidden h-28 w-80 text-miel/70 md:block"
                    fill="none"
                  >
                    <path
                      d="M8 72
                        C 75 22, 150 108, 220 58
                        C 252 36, 277 22, 296 30
                        C 315 38, 314 63, 294 74
                        C 275 84, 257 72, 261 55
                        C 266 34, 301 23, 347 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-8 items-center justify-center rounded-full bg-primario text-xs font-bold text-superficie"
                        >
                          5'
                        </span>

                        <p className="text-xs font-bold uppercase tracking-wide text-secundario">
                          Resumen rápido del perfil
                        </p>
                      </div>

                      <p className="font-display text-h1 text-primario">
                        Conocelo en 5 minutos
                      </p>

                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-texto-suave">
                        Intereses, cómo comunicarse, qué lo ayuda, qué evitar y qué hacer si
                        se desregula, en una sola página.
                      </p>
                    </div>

                    <div>
                      <Boton to={`/proyectos/${id}/conocelo`} aria-label="Conocelo en 5 minutos">
                        Abrir resumen
                      </Boton>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-miel bg-miel/10 p-5 shadow-sm sm:p-6 lg:col-span-4">
                  <div className="flex h-full flex-col justify-between gap-5">
                    <div>
                      <span
                        aria-hidden="true"
                        className="mb-3 flex size-9 items-center justify-center rounded-md bg-primario/10 text-primario"
                      >
                        <Heart size={20} weight="fill" />
                      </span>

                      <p className="font-display text-h2 text-secundario">
                        Si se desregula
                      </p>

                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-texto-suave">
                        Señales, qué ayuda y qué evitar en un momento difícil.
                      </p>
                    </div>

                    <div>
                      <Boton
                        to={`/proyectos/${id}/desregulacion`}
                        variant="secondary"
                      >
                        Ver guía
                      </Boton>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {!seccion && <ProximosCambios proyectoId={id} />}
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
            <div
              className={
                seccion ? 'grid gap-5' : 'grid grid-cols-1 gap-5 md:grid-cols-2'
              }
            >
              {(seccion ? [seccion] : seccionesPerfil).map((item) => (
                <BloquePerfil
                  esTutor={proyectoActual?.id === id && rolCodigo === 'TUTOR'}
                  usuarioId={usuario?.id}
                  alActualizarRevision={reintentar}
                  key={item.slug}
                  seccion={item}
                  aportes={esComunicacion ? aportesComunicacion : esSensorial ? aportesSensoriales : esEstrategia ? aportesEstrategia : esRutina ? aportesRutina : esDesregulacion ? aportesDesregulacion : datos.aportes.filter(
                    (aporte) => aporte.tipo === item.tipo,
                  )}
                  proyectoId={id}
                  completo={Boolean(seccion)}
                  encabezado={(alAgregar) => {
                    if (!seccion) return null

                    if (item.tipo === 'RUTINA') {
                      return (
                        <FiltrosRutinas
                          busqueda={busqueda}
                          setBusqueda={setBusqueda}
                          categoria={categoria}
                          setCategoria={setCategoria}
                          especialidad={especialidad}
                          setEspecialidad={setEspecialidad}
                          visibilidad={visibilidad}
                          setVisibilidad={setVisibilidad}
                          orden={orden}
                          setOrden={setOrden}
                          soloMios={soloMios}
                          setSoloMios={setSoloMios}
                          alAgregar={alAgregar}
                          puedeCrear={proyecto.puedeCargar === true}
                          aportes={datos.aportes.filter(
                            (aporte) => aporte.tipo === 'RUTINA',
                          )}
                        />
                      )
                    }

                    if (item.tipo === 'COMUNICACION') {
                      return encabezadoCompleto({
                        titulo: 'Comunicación',
                        descripcion:
                          'Cómo comprende, expresa lo que necesita y se comunica mejor en distintos contextos.',
                        alAgregar,
                        puedeCrear: proyecto.puedeCargar === true,

                        filtros: (
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
                            placeholder="Buscar en comunicación…"
                            ariaBusqueda="Buscar en comunicación"
                          />
                        ),

                        categorias: (
                          <div
                            className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
                            aria-label="Categorías de comunicación"
                          >
                          <button
                              type="button"
                              onClick={() => setCategoria('')}
                              aria-pressed={!categoria}
                              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 ${
                                !categoria
                                  ? 'border-primario bg-primario text-superficie'
                                  : 'border-borde bg-superficie text-secundario'
                              }`}
                            >
                              Todos
                            </button>

                            {CATEGORIAS_COMUNICACION.map(([valor, etiqueta]) => {
                              const Icono = ICONOS_COMUNICACION[valor]
                              const activa = categoria === valor

                              return (
                                <ChipFiltro
                                  key={valor}
                                  activo={activa}
                                  etiqueta={etiqueta}
                                  Icono={Icono}
                                  tono={TONOS_COMUNICACION[valor]}
                                  onClick={() => setCategoria(activa ? '' : valor)}
                                />
                              )
                            })}
                          </div>
                        ),
                      })
                    }

                    if (item.tipo === 'SENSORIAL') {
                      return encabezadoCompleto({
                        titulo: 'Perfil sensorial',
                        descripcion:
                          'Cómo responde a distintos estímulos del entorno, qué sensaciones busca o evita y qué lo ayuda a sentirse más cómodo y regulado.',
                        alAgregar,
                        puedeCrear: proyecto.puedeCargar === true,

                        filtros: (
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
                            placeholder="Buscar en perfil sensorial…"
                            ariaBusqueda="Buscar en perfil sensorial"
                            extra={
                              <label className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-borde bg-superficie px-3 text-sm text-texto">
                                <span className="sr-only">Lista</span>

                                <select
                                  aria-label="Lista"
                                  value={listaSensorial}
                                  onChange={(event) =>
                                    setListaSensorial(event.target.value)
                                  }
                                  className="bg-transparent"
                                >
                                  <option value="">Ambas listas</option>
                                  <option value="AYUDA">Le ayuda</option>
                                  <option value="CUESTA">Le cuesta</option>
                                </select>
                              </label>
                            }
                          />
                        ),

                        categorias: (
                          <div
                            className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
                            aria-label="Categorías sensoriales"
                          >
                            <button
                              type="button"
                              onClick={() => setCategoria('')}
                              aria-pressed={!categoria}
                              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 ${
                                !categoria
                                  ? 'border-primario bg-primario text-superficie'
                                  : 'border-borde bg-superficie text-secundario'
                              }`}
                            >
                              Todos
                            </button>

                            {CATEGORIAS_SENSORIALES.map(([valor, etiqueta]) => {
                              const Icono = ICONOS_SENSORIALES[valor]
                              const activa = categoria === valor

                              return (
                                <ChipFiltro
                                  key={valor}
                                  activo={activa}
                                  etiqueta={etiqueta}
                                  Icono={Icono}
                                  tono={TONOS_SENSORIALES[valor]}
                                  onClick={() => setCategoria(activa ? '' : valor)}
                                />
                              )
                            })}
                          </div>
                        ),
                      })
                    }

                    if (item.tipo === 'ESTRATEGIA') {
                      return encabezadoCompleto({
                        titulo: 'Estrategias',
                        descripcion:
                          'Apoyos y formas de acompañamiento que facilitan la comprensión, la participación y la autonomía en distintos contextos.',
                        alAgregar,
                        puedeCrear: proyecto.puedeCargar === true,

                        filtros: (
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
                            placeholder="Buscar en estrategias…"
                            ariaBusqueda="Buscar en estrategias"
                            extra={
                              <label className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-borde bg-superficie px-3 text-sm text-texto">
                                <span className="sr-only">Resultado</span>

                                <select
                                  aria-label="Resultado"
                                  value={resultadoEstrategia}
                                  onChange={(event) =>
                                    setResultadoEstrategia(event.target.value)
                                  }
                                  className="max-w-40 bg-transparent"
                                >
                                  <option value="">Todos los resultados</option>

                                  {RESULTADOS_ESTRATEGIA.map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>
                                      {etiqueta}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            }
                          />
                        ),

                        categorias: (
                          <div
                            className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
                            aria-label="Categorías de estrategias"
                          >
                            {CATEGORIAS_ESTRATEGIA.map(([valor, etiqueta]) => {
                              const Icono = ICONOS_ESTRATEGIA[valor]
                              const activa = categoria === valor

                              return (
                                <ChipFiltro
                                  key={valor}
                                  activo={activa}
                                  etiqueta={etiqueta}
                                  Icono={Icono}
                                  tono={TONOS_ESTRATEGIA[valor]}
                                  onClick={() => setCategoria(activa ? '' : valor)}
                                />
                              )
                            })}
                          </div>
                        ),
                      })
                    }

                    if (item.tipo === 'DESREGULACION') {
                      return encabezadoCompleto({
                        titulo: 'Si se desregula',
                        descripcion:
                          'Pautas para reconocer una desregulación y acompañar de la manera que mejor funciona.',
                        alAgregar,
                        puedeCrear: proyecto.puedeCargar === true,

                        filtros: (
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
                            placeholder="Buscar en desregulación…"
                            ariaBusqueda="Buscar en desregulación"
                          />
                        ),

                        categorias: (
                          <div
                            className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
                            aria-label="Categorías de desregulación"
                          >
                            <button
                              type="button"
                              onClick={() => setCategoria('')}
                              aria-pressed={!categoria}
                              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 ${
                                !categoria
                                  ? 'border-primario bg-primario text-superficie'
                                  : 'border-borde bg-superficie text-secundario'
                              }`}
                            >
                              Todos
                            </button>

                            {CATEGORIAS_DESREGULACION.map(([valor, etiqueta]) => {
                              const Icono = ICONOS_DESREGULACION[valor]
                              const activa = categoria === valor

                              return (
                                <ChipFiltro
                                  key={valor}
                                  activo={activa}
                                  etiqueta={etiqueta}
                                  Icono={Icono}
                                  tono={TONOS_DESREGULACION[valor]}
                                  hoverCruz={HOVER_CRUZ_DESREGULACION[valor]}
                                  onClick={() => setCategoria(activa ? '' : valor)}
                                />
                              )
                            })}
                          </div>
                        ),
                      })
                    }

                    if (item.tipo === 'NOTA_PROFESIONAL') {
                      return encabezadoConBoton(
                        'Notas profesionales',
                        null,
                        alAgregar,
                        proyecto.puedeCargarNotas === true,
                        'Agregar nota',
                      )
                    }

                    return encabezadoConBoton(
                      item.titulo,
                      item.descripcion ?? null,
                      alAgregar,
                      proyecto.puedeCargar === true,
                    )
                  }}                  
                  
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

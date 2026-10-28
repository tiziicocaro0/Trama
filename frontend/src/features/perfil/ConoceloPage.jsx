import {
  ChatCircle,
  Ear,
  Heart,
  Lightbulb,
  Palette,
  Printer,
} from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { obtenerResumenProyecto } from '../../api/aportes.js'
import Boton from '../../components/ui/Boton.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'
import usePerfil from './hooks/usePerfil.js'

const ETIQUETAS_INTENSIDAD = {
  ALTA: 'Intensidad alta',
  MEDIA: 'Intensidad media',
  BAJA: 'Intensidad baja',
}

function leerDatosJson(texto) {
  try {
    const parsed = JSON.parse(texto ?? '')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {}
  } catch {
    return {}
  }
}

function SeccionResumen({
  id,
  titulo,
  descripcion,
  icono: Icono,
  tono,
  items,
  textoVacio,
  destacar = false,
}) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col rounded-lg p-5 shadow-sm sm:p-6 ${
        destacar
          ? 'border border-primario/30 bg-superficie md:col-span-2'
          : 'bg-superficie'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${tono}`}
        >
          <Icono size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id={id} className="font-display text-h2 text-secundario">
            {titulo}
          </h2>
          {descripcion && (
            <p className="text-sm text-texto-suave">{descripcion}</p>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-borde/40">
          {items.map((item) => {
            const extra = leerDatosJson(item.datos)
            const etiquetaIntensidad =
              item.tipo === 'INTERES'
                ? ETIQUETAS_INTENSIDAD[extra.intensidad]
                : null

            return (
              <li key={item.id} className="py-3 first:pt-1 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-sans text-base font-bold text-texto">
                    {item.titulo}
                  </h3>
                  {etiquetaIntensidad && (
                    <span className="inline-flex items-center rounded-full bg-miel/25 px-2.5 py-0.5 text-xs font-semibold text-texto">
                      {etiquetaIntensidad}
                    </span>
                  )}
                </div>
                {item.contenido && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave">
                    {item.contenido}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-2 text-sm text-texto-suave">{textoVacio}</p>
      )}
    </section>
  )
}

export default function ConoceloPage() {
  const { id } = useParams()
  const {
    proyecto,
    datos: resumen,
    cargando,
    error,
    reintentar,
  } = usePerfil(id, obtenerResumenProyecto)

  const interesesPrincipales = (resumen?.intereses ?? []).slice(0, 3)
  const comunicacion = resumen?.comunicacion ?? []
  const queLoAyuda = [
    ...(resumen?.estrategias ?? []),
    ...(resumen?.fortalezas ?? []),
  ]
  const queEvitar = resumen?.sensorial ?? []
  const desregulacion = resumen?.desregulacion ?? []

  function imprimirResumen() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print()
    }
  }

  return (
    <div className="min-h-svh bg-fondo text-texto">
      <a href="#contenido-conocelo" className="skip-link print:hidden">
        Saltar al contenido
      </a>
      <main
        id="contenido-conocelo"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10"
      >
        {cargando ? (
          <p role="status" className="py-12 text-center">
            Cargando el resumen…
          </p>
        ) : error ? (
          <div className="space-y-5 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar el resumen
            </h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={reintentar}>Reintentar</Boton>
              <Boton to={`/proyectos/${id}`} variant="secondary">
                Volver al perfil
              </Boton>
            </div>
          </div>
        ) : (
          proyecto && (
            <>
              <CabeceraPerfil
                proyecto={proyecto}
                seccion={{ titulo: 'Conocelo en 5 minutos' }}
              />
              <div className="print:hidden">
                <NavegacionPerfil proyectoId={id} />
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-superficie p-5 shadow-sm sm:p-6">
                <div>
                  <p className="font-display text-h2 text-primario">
                    Conocelo en 5 minutos
                  </p>
                  <p className="mt-1 text-sm text-texto-suave">
                    Resumen rápido en una sola página con lo que ya está cargado
                    en el perfil y tenés permiso para ver.
                  </p>
                </div>
                <div className="print:hidden">
                  <Boton variant="secondary" onClick={imprimirResumen}>
                    <Printer size={20} aria-hidden="true" />
                    Imprimir
                  </Boton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SeccionResumen
                  id="resumen-intereses"
                  titulo="3 intereses principales"
                  descripcion="Temas, juegos o actividades que lo motivan y conectan."
                  icono={Palette}
                  tono="bg-miel text-texto"
                  items={interesesPrincipales}
                  textoVacio="Todavía no hay intereses cargados visibles para vos."
                />

                <SeccionResumen
                  id="resumen-comunicacion"
                  titulo="Cómo hablarle"
                  descripcion="Formas de comunicarse y apoyos que facilitan la comprensión."
                  icono={ChatCircle}
                  tono="bg-agua text-superficie"
                  items={comunicacion}
                  textoVacio="Todavía no hay orientaciones de comunicación visibles para vos."
                />

                <SeccionResumen
                  id="resumen-ayuda"
                  titulo="Qué lo ayuda"
                  descripcion="Estrategias y fortalezas cotidianas que acompañan su bienestar."
                  icono={Lightbulb}
                  tono="bg-secundario text-superficie"
                  items={queLoAyuda}
                  textoVacio="Todavía no hay estrategias ni fortalezas visibles para vos."
                />

                <SeccionResumen
                  id="resumen-evitar"
                  titulo="Qué evitar"
                  descripcion="Estímulos o situaciones del perfil sensorial a tener en cuenta."
                  icono={Ear}
                  tono="bg-primario text-superficie"
                  items={queEvitar}
                  textoVacio="Todavía no hay pautas sensoriales o situaciones a evitar visibles para vos."
                />

                <SeccionResumen
                  id="resumen-desregulacion"
                  titulo="Qué hacer si se desregula"
                  descripcion="Pautas acordadas por su red para acompañarlo con calma."
                  icono={Heart}
                  tono="bg-primario text-superficie"
                  items={desregulacion}
                  textoVacio="Todavía no hay pautas de desregulación visibles para vos."
                  destacar
                />
              </div>

              <div className="mt-6 print:hidden">
                <Link
                  to={`/proyectos/${id}`}
                  className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
                >
                  Volver al perfil
                </Link>
              </div>
            </>
          )
        )}
      </main>
    </div>
  )
}


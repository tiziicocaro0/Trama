import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { buscarEnPerfil } from '../../api/busqueda.js'
import { ETIQUETAS_APORTE, ICONOS_APORTE } from './iconosAporte.js'
import { seccionDesregulacion, seccionesPerfil, seccionNotas } from './perfil.js'

// Dónde vive cada tipo de aporte, para llevar al resultado
const SLUGS = {
  ...Object.fromEntries(seccionesPerfil.map(({ tipo, slug }) => [tipo, slug])),
  [seccionDesregulacion.tipo]: seccionDesregulacion.slug,
  [seccionNotas.tipo]: seccionNotas.slug,
  OBSERVACION: 'bitacora',
  ABC: 'bitacora',
}
const ORDEN = [...seccionesPerfil.map(({ tipo }) => tipo), 'DESREGULACION', 'NOTA_PROFESIONAL', 'OBSERVACION', 'ABC']

function agrupar(resultados) {
  const grupos = new Map()
  for (const resultado of resultados) {
    const seccion = ETIQUETAS_APORTE[resultado.tipo] ?? 'Otros'
    if (!grupos.has(seccion)) grupos.set(seccion, { tipo: resultado.tipo, items: [] })
    grupos.get(seccion).items.push(resultado)
  }
  return [...grupos.entries()].sort(([, a], [, b]) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo))
}

// 4.5: los resultados de buscar en el perfil, agrupados por sección. Cada uno lleva a su aporte.
export default function BusquedaPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const consulta = (params.get('q') ?? '').trim()
  const [estado, setEstado] = useState({ consulta: null, resultados: [], error: '' })

  useEffect(() => {
    if (!consulta) return undefined
    const control = new AbortController()
    buscarEnPerfil(id, consulta, control.signal).then(
      (resultados) => setEstado({ consulta, resultados, error: '' }),
      (error) => {
        if (!control.signal.aborted) setEstado({ consulta, resultados: [], error: error.message })
      },
    )
    return () => control.abort()
  }, [id, consulta])

  const cargando = Boolean(consulta) && estado.consulta !== consulta
  const grupos = agrupar(estado.resultados)

  return (
    <main tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-10 text-texto focus:outline-none sm:px-8">
      <h1 className="mb-1 font-display text-h1 text-secundario">Buscar en el perfil</h1>
      {!consulta && <p className="text-texto-suave">Escribí una palabra en el buscador de arriba.</p>}
      {cargando && <p role="status" className="text-texto-suave">Buscando «{consulta}»…</p>}
      {!cargando && consulta && (
        <p role="status" className="mb-5 text-texto-suave">
          {estado.error ||
            (estado.resultados.length === 0
              ? `No encontramos nada con «${consulta}».`
              : `${estado.resultados.length} ${estado.resultados.length === 1 ? 'resultado' : 'resultados'} para «${consulta}»`)}
        </p>
      )}
      <div className="space-y-6">
        {grupos.map(([seccion, { tipo, items }]) => {
          const Icono = ICONOS_APORTE[tipo] ?? MagnifyingGlass
          return (
            <section key={seccion} aria-labelledby={`grupo-${tipo}`}>
              <h2 id={`grupo-${tipo}`} className="mb-2 flex items-center gap-2 font-semibold text-secundario">
                <Icono size={20} aria-hidden="true" className="text-primario" />
                {seccion} <span className="text-sm font-normal text-texto-suave">({items.length})</span>
              </h2>
              <ul className="space-y-2">
                {items.map((resultado) => (
                  <li key={resultado.id}>
                    <Link
                      to={`/proyectos/${id}/${SLUGS[resultado.tipo] ?? ''}#aporte-${resultado.id}`}
                      className="block rounded-lg bg-superficie p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none"
                    >
                      <span className="block font-semibold text-texto">{resultado.titulo}</span>
                      {resultado.fragmento && (
                        <span className="mt-1 block text-sm text-texto-suave">{resultado.fragmento}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}

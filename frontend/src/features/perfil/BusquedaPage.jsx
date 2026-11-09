import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { buscarAportes } from '../../api/aportes.js'
import Boton from '../../components/ui/Boton.jsx'
import { seccionesPerfil, seccionDesregulacion, seccionNotas } from './perfil.js'

const secciones = Object.fromEntries([...seccionesPerfil, seccionDesregulacion, seccionNotas].map((item) => [item.tipo, item]))
const titulosAdicionales = { OBSERVACION: 'Bitácora', ABC: 'Bitácora', SUGERENCIA: 'Sugerencias' }

function destino(proyectoId, resultado) {
  const base = `/proyectos/${encodeURIComponent(proyectoId)}`
  const id = encodeURIComponent(resultado.id)
  if (resultado.tipo === 'OBSERVACION' || resultado.tipo === 'ABC') return `${base}/bitacora?aporte=${id}`
  if (secciones[resultado.tipo]) return `${base}/${secciones[resultado.tipo].slug}#aporte-${id}`
  return `${base}/aportes/${id}`
}

export default function BusquedaPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const consulta = (params.get('q') || '').trim().replace(/\s+/g, ' ')
  const [resultado, setResultado] = useState(null)
  const [intento, setIntento] = useState(0)
  const clave = `${id}:${consulta}:${intento}`

  useEffect(() => {
    if (!consulta) return undefined
    const controller = new AbortController()
    buscarAportes(id, consulta, controller.signal).then(
      (items) => { if (!controller.signal.aborted) setResultado({ clave, items }) },
      () => { if (!controller.signal.aborted) setResultado({ clave, error: true }) },
    )
    return () => controller.abort()
  }, [id, consulta, clave])

  const vigente = resultado?.clave === clave
  const grupos = new Map()
  if (vigente && resultado.items) {
    for (const item of resultado.items) {
      const nombre = secciones[item.tipo]?.titulo ?? titulosAdicionales[item.tipo] ?? 'Otros aportes'
      if (!grupos.has(nombre)) grupos.set(nombre, [])
      grupos.get(nombre).push(item)
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 text-texto sm:px-8">
      <h2 className="font-display text-h1 text-secundario">Resultados de búsqueda</h2>
      {!consulta ? <p className="mt-4">Ingresá una palabra o frase para buscar.</p> : (
        <>
          <p className="mt-2 break-words text-texto-suave">Buscaste: {consulta}</p>
          {!vigente ? <p role="status" className="mt-5">Buscando aportes…</p> : resultado.error ? (
            <div className="mt-5 space-y-3"><p role="alert" className="text-error">No pudimos buscar los aportes.</p><Boton variant="secondary" onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Boton></div>
          ) : resultado.items.length === 0 ? <p className="mt-5">No encontramos aportes para esta búsqueda.</p> : (
            <div className="mt-5 space-y-5">
              <p>{resultado.items.length} {resultado.items.length === 1 ? 'resultado' : 'resultados'}</p>
              {[...grupos].map(([nombre, items]) => (
                <section key={nombre} className="rounded-lg bg-superficie p-5 shadow-sm">
                  <h3 className="font-display text-h2 text-secundario">{nombre}</h3>
                  <ul className="mt-3 divide-y divide-borde/40">
                    {items.map((item) => <li key={item.id}><Link to={destino(id, item)} className="block rounded-sm py-3 focus-visible:outline-2 focus-visible:outline-primario"><span className="block break-words font-semibold text-primario">{item.titulo}</span>{item.fragmento && <span className="mt-1 block whitespace-pre-wrap break-words text-sm text-texto-suave">{item.fragmento}</span>}</Link></li>)}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
      <Link to={`/proyectos/${id}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al perfil</Link>
    </main>
  )
}

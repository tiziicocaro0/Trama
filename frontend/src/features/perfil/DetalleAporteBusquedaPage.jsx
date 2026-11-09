import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listarAportes } from '../../api/aportes.js'
import TarjetaAporte from '../../components/ui/TarjetaAporte.jsx'
import usePerfil from './hooks/usePerfil.js'

// Para tipos que aún no tienen una sección propia, reutiliza el listado autorizado y la tarjeta existente.
export default function DetalleAporteBusquedaPage() {
  const { id, aporteId } = useParams()
  const cargar = useCallback((proyectoId, signal) => listarAportes(proyectoId, signal), [])
  const { datos, cargando, error } = usePerfil(id, cargar)
  const aporte = datos?.aportes?.find((item) => item.id === aporteId)
  return <main className="mx-auto max-w-6xl px-4 pb-10 text-texto sm:px-8">
    <h2 className="font-display text-h1 text-secundario">Aporte</h2>
    {cargando ? <p role="status">Cargando aporte…</p> : error ? <p role="alert">{error}</p> : aporte ? <div className="mt-4 rounded-lg bg-superficie p-5"><TarjetaAporte aporte={aporte} /></div> : <p className="mt-4">No encontramos este aporte o ya no está disponible.</p>}
    <Link to={`/proyectos/${id}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al perfil</Link>
  </main>
}

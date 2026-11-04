import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarBlank, CalendarCheck, CaretLeft, CaretRight, MoonStars, Sun, SunHorizon, X } from '@phosphor-icons/react'
import { obtenerVistaImagen } from '../../api/archivos.js'
import { listarEventos } from '../../api/eventos.js'
import Boton from '../../components/ui/Boton.jsx'
import usePerfil from '../perfil/hooks/usePerfil.js'
import { esFechaIsoValida, sumarDias } from './utils/periodo.js'
import { hoyIso } from '../../utils/fechas.js'

function fechaVisible(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const partes = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).formatToParts(new Date(anio, mes - 1, dia))
  const obtener = (tipo) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  const texto = `${obtener('weekday')} ${obtener('day')} de ${obtener('month')}`
  return texto.charAt(0).toLocaleUpperCase('es-AR') + texto.slice(1)
}

function saludoActual() {
  const hora = new Date().getHours()
  if (hora >= 20 || hora < 6) return { texto: 'Buenas noches', Icono: MoonStars }
  if (hora >= 17) return { texto: 'Buenas tardes', Icono: SunHorizon }
  return { texto: 'Buenos días', Icono: Sun }
}

function textoHora(valor) {
  if (typeof valor !== 'string' || !/^\d{2}:\d{2}/.test(valor)) return 'Todo el día'
  return valor.slice(0, 5)
}

function ordenarActividades(eventos, fecha) {
  return eventos
    .filter((evento) => (evento.fechaOcurrencia || evento.fecha) === fecha)
    .slice()
    .sort((a, b) => (a.horaInicio || '23:59').localeCompare(b.horaInicio || '23:59'))
}

function claveActividad(evento) {
  return `${evento.id}-${evento.fechaOcurrencia || evento.fecha}`
}

function TarjetaActividad({ actividad, imagen }) {
  const Icono = actividad.esCambio ? CalendarCheck : CalendarBlank
  const hora = textoHora(actividad.horaInicio)
  return (
    <li className={`flex min-h-32 items-center gap-4 rounded-lg border bg-superficie p-4 shadow-sm sm:gap-6 sm:p-6 ${actividad.esCambio ? 'border-primario' : 'border-borde'}`}>
      <span className={`flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:size-24 md:size-28 ${actividad.esCambio ? 'border-primario bg-primario/10 text-primario' : 'border-borde bg-fondo text-secundario'}`}>
        {imagen ? <img src={imagen} alt="" className="size-full object-cover" /> : <Icono size={48} aria-hidden="true" />}
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-2xl font-semibold tabular-nums text-texto sm:text-3xl">{hora}</span>
        <span className="mt-1 block break-words font-display text-3xl leading-tight text-texto sm:text-4xl">{actividad.titulo}</span>
        {actividad.esCambio && <span className="mt-2 inline-flex rounded-full bg-primario/10 px-3 py-1 text-sm font-semibold text-primario">Cambio de rutina</span>}
      </span>
    </li>
  )
}

export default function VistaDiaPage() {
  const { id: proyectoId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const fechaInicial = esFechaIsoValida(searchParams.get('fecha')) ? searchParams.get('fecha') : hoyIso()
  const [fecha, setFecha] = useState(fechaInicial)
  const navegar = useNavigate()
  const cargarEventos = useCallback((id, signal) => (
    listarEventos(id, { desde: fecha, hasta: fecha, signal })
  ), [fecha])
  const { proyecto, datos, cargando, error, reintentar } = usePerfil(proyectoId, cargarEventos)
  const actividades = useMemo(() => ordenarActividades(datos ?? [], fecha), [datos, fecha])
  const [imagenes, setImagenes] = useState({})
  const saludo = saludoActual()
  const IconoSaludo = saludo.Icono

  useEffect(() => {
    let activo = true
    const urls = []
    const solicitudes = actividades.filter((actividad) => actividad.imagenId).map(async (actividad) => {
      const clave = claveActividad(actividad)
      try {
        const url = await obtenerVistaImagen(proyectoId, actividad.imagenId)
        if (url && !activo) {
          window.URL.revokeObjectURL(url)
          return [clave, null]
        }
        if (url) urls.push(url)
        return [clave, url]
      } catch {
        return [clave, null]
      }
    })
    Promise.all(solicitudes).then((entradas) => {
      if (activo) setImagenes(Object.fromEntries(entradas))
    })
    return () => {
      activo = false
      urls.forEach((url) => window.URL.revokeObjectURL(url))
    }
  }, [actividades, proyectoId])

  function volverAlCalendario() {
    navegar(`/proyectos/${proyectoId}/calendario?fecha=${fecha}`)
  }

  return (
    <main tabIndex={-1} className="min-h-svh bg-fondo px-4 py-4 text-texto sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-end">
          <button type="button" onClick={volverAlCalendario} aria-label="Volver al calendario" title="Volver al calendario" className="flex size-11 items-center justify-center rounded-full border border-borde bg-superficie text-texto hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario">
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <header className="mb-8 mt-2 text-center sm:mb-10">
          <span className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-acento/15 text-acento sm:size-20">
            <IconoSaludo size={38} aria-hidden="true" />
          </span>
          <div className="mb-4 flex items-center justify-center gap-2 sm:gap-4">
            <button type="button" onClick={() => setFecha((actual) => sumarDias(actual, -1))} aria-label="Día anterior" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario">
              <CaretLeft size={22} aria-hidden="true" />
            </button>
            <time dateTime={fecha} aria-live="polite" className="rounded-full border border-borde bg-superficie px-4 py-2 font-sans text-lg font-semibold sm:px-6 sm:text-xl">{fechaVisible(fecha)}</time>
            <button type="button" onClick={() => setFecha((actual) => sumarDias(actual, 1))} aria-label="Día siguiente" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie hover:bg-decoracion focus-visible:outline-2 focus-visible:outline-primario">
              <CaretRight size={22} aria-hidden="true" />
            </button>
          </div>
          <h1 className="font-display text-4xl leading-tight text-texto sm:text-5xl">{saludo.texto}{proyecto?.nombre ? `, ${proyecto.nombre}` : ''}</h1>
          <p className="mt-2 text-xl text-texto-suave sm:text-2xl">Esto es lo que tenés hoy</p>
        </header>

        {cargando && <p role="status" className="py-8 text-center text-lg text-texto-suave">Cargando las actividades…</p>}
        {error && <div className="mx-auto max-w-xl rounded-lg border border-error bg-superficie p-6 text-center"><p role="alert" className="text-lg text-error">{error}</p><Boton onClick={reintentar} className="mt-4">Reintentar</Boton></div>}
        {!cargando && !error && actividades.length === 0 && <p className="rounded-lg border border-borde bg-superficie px-6 py-10 text-center font-display text-2xl text-texto sm:py-14 sm:text-3xl">Hoy no hay actividades programadas.</p>}
        {!cargando && !error && actividades.length > 0 && (
          <ul aria-label="Actividades del día" className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-5">
            {actividades.map((actividad) => <TarjetaActividad key={claveActividad(actividad)} actividad={actividad} imagen={imagenes[claveActividad(actividad)]} />)}
          </ul>
        )}
      </div>
    </main>
  )
}

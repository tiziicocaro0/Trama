import { CaretDown } from '@phosphor-icons/react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { seccionDesregulacion, seccionesPerfil, seccionNotas } from '../perfil.js'

// Todas las pestañas del perfil en una sola fila: la información general, cada sección
// y los espacios del niño (Red, Datos personales, Recursos).
const pestanas = [
  { slug: '', titulo: 'Información general' },
  ...seccionesPerfil.map(({ slug, titulo }) => ({ slug, titulo })),
  { slug: seccionDesregulacion.slug, titulo: seccionDesregulacion.titulo },
  { slug: seccionNotas.slug, titulo: seccionNotas.titulo },
  // 4.1: camino directo a las observaciones y registros ABC, como las demás secciones
  { slug: 'bitacora', titulo: 'Bitácora' },
  { slug: 'en-casa', titulo: 'En casa' },
  { slug: 'red', titulo: 'Red' },
  { slug: 'datos-personales', titulo: 'Datos personales' },
  { slug: 'recursos', titulo: 'Recursos' },
]

const SEPARACION = 16 // gap-4
const ANCHO_MAS = 88 // lugar que se reserva para el botón "Más"

// Cuántas pestañas entran en el ancho disponible. Si no entran todas, se deja lugar para "Más".
function calcularVisibles(anchoDisponible, anchos) {
  const total = anchos.reduce((suma, ancho) => suma + ancho, 0) + SEPARACION * (anchos.length - 1)
  if (!anchoDisponible || total <= anchoDisponible) return anchos.length
  let usado = ANCHO_MAS
  let cantidad = 0
  for (const ancho of anchos) {
    if (usado + ancho + SEPARACION > anchoDisponible) break
    usado += ancho + SEPARACION
    cantidad += 1
  }
  return Math.max(1, cantidad)
}

const clasePestana = (seleccionado) =>
  `inline-flex min-h-11 items-center whitespace-nowrap border-b-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none ${seleccionado ? 'border-primario font-semibold text-primario' : 'border-transparent text-texto hover:text-primario'}`

// Pestañas subrayadas, fijas en la cabecera: solo cambia cuál está marcada.
// Las que no entran en el ancho van a un menú "Más" (sin desplazamiento de costado).
export default function NavegacionPerfil({ proyectoId }) {
  const { pathname } = useLocation()
  const actual = pathname.replace(/\/+$/, '')
  const contenedor = useRef(null)
  const medidas = useRef([])
  const menu = useRef(null)
  const idMenu = useId()
  const [visibles, setVisibles] = useState(pestanas.length)
  const [abierto, setAbierto] = useState(false)

  // Se miden las pestañas (en una fila invisible) y se recalcula cuando cambia el ancho
  useLayoutEffect(() => {
    const nav = contenedor.current
    if (!nav) return undefined
    const medir = () => {
      const anchos = medidas.current.map((elemento) => elemento?.offsetWidth ?? 0)
      setVisibles(calcularVisibles(nav.clientWidth, anchos))
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(medir)
    observador.observe(nav)
    return () => observador.disconnect()
  }, [])

  // El menú se cierra al elegir una pestaña, al tocar fuera o con Escape
  useEffect(() => {
    if (!abierto) return undefined
    const alTocarFuera = (evento) => {
      if (!menu.current?.contains(evento.target)) setAbierto(false)
    }
    const alTeclar = (evento) => {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alTocarFuera)
    document.addEventListener('keydown', alTeclar)
    return () => {
      document.removeEventListener('mousedown', alTocarFuera)
      document.removeEventListener('keydown', alTeclar)
    }
  }, [abierto])

  const conDestino = pestanas.map((pestana) => {
    const destino = pestana.slug ? `/proyectos/${proyectoId}/${pestana.slug}` : `/proyectos/${proyectoId}`
    return { ...pestana, destino, seleccionado: actual === destino }
  })
  const enFila = conDestino.slice(0, visibles)
  const enMenu = conDestino.slice(visibles)
  const marcadaEnMenu = enMenu.some(({ seleccionado }) => seleccionado)

  return (
    <nav ref={contenedor} aria-label="Espacios del perfil" className="relative border-b border-borde print:hidden">
      {/* Fila invisible solo para medir el ancho de cada pestaña */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 flex gap-4">
        {pestanas.map(({ titulo }, indice) => (
          <span
            key={titulo}
            ref={(elemento) => { medidas.current[indice] = elemento }}
            className="whitespace-nowrap border-b-2 border-transparent text-sm font-semibold"
          >
            {titulo}
          </span>
        ))}
      </div>

      <ul className="-mb-px flex gap-4">
        {enFila.map(({ titulo, destino, seleccionado }) => (
          <li key={titulo} className="shrink-0">
            <Link
              to={destino}
              aria-current={seleccionado ? 'page' : undefined}
              className={clasePestana(seleccionado)}
            >
              {titulo}
            </Link>
          </li>
        ))}

        {enMenu.length > 0 && (
          <li ref={menu} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAbierto((estado) => !estado)}
              aria-expanded={abierto}
              aria-controls={abierto ? idMenu : undefined}
              className={`${clasePestana(marcadaEnMenu)} gap-1`}
            >
              Más
              <CaretDown
                size={14}
                weight="bold"
                aria-hidden="true"
                className={`transition-transform motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`}
              />
            </button>
            {abierto && (
              <ul
                id={idMenu}
                aria-label="Más espacios del perfil"
                className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-borde bg-crema p-1 shadow-md"
              >
                {enMenu.map(({ titulo, destino, seleccionado }) => (
                  <li key={titulo}>
                    <Link
                      to={destino}
                      onClick={() => setAbierto(false)}
                      aria-current={seleccionado ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-md px-3 text-sm transition-colors hover:bg-superficie focus-visible:outline-2 focus-visible:outline-primario motion-reduce:transition-none ${seleccionado ? 'font-semibold text-primario' : 'text-texto'}`}
                    >
                      {titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}
      </ul>
    </nav>
  )
}

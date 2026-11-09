import { useEffect, useId, useRef, useState } from 'react'
import { listarMiembros } from '../../../api/miembros.js'

function normalizar(texto) {
  return texto.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function buscarMencion(texto, cursor) {
  const anterior = texto.slice(0, cursor)
  const inicio = anterior.lastIndexOf('@')
  if (inicio < 0 || (inicio > 0 && /[\p{L}\p{N}._-]/u.test(anterior[inicio - 1]))) return null
  const busqueda = anterior.slice(inicio + 1)
  if (!/^[\p{L}\p{M}\p{N} '\u2019-]*$/u.test(busqueda)) return null
  return { inicio, fin: cursor, busqueda }
}

function prepararMiembros(miembros, usuarioId) {
  const personas = [...new Map(miembros.filter((m) => m.usuarioId).map((m) => [m.usuarioId, m])).values()]
  const aliases = new Map()
  for (const persona of personas) {
    const nombre = persona.nombre.trim()
    const completo = `${nombre} ${persona.apellido.trim()}`.trim()
    for (const alias of new Set([normalizar(nombre), normalizar(completo)])) {
      if (alias) aliases.set(alias, (aliases.get(alias) || 0) + 1)
    }
  }
  const sugerencias = new Map()
  for (const persona of personas.filter((persona) => persona.usuarioId !== usuarioId)) {
    const nombre = `${persona.nombre.trim()} ${persona.apellido.trim()}`.trim()
    const clave = normalizar(nombre)
    if (clave && !sugerencias.has(clave)) sugerencias.set(clave, { id: persona.usuarioId, nombre, ambiguo: aliases.get(clave) !== 1 })
  }
  return [...sugerencias.values()]
}

export default function CampoMenciones({ proyectoId, usuarioId, valor, onChange, disabled }) {
  const id = useId()
  const campo = useRef(null)
  const controlador = useRef(null)
  const [cursor, setCursor] = useState(0)
  const [cerrado, setCerrado] = useState(false)
  const [seleccion, setSeleccion] = useState(0)
  const [miembros, setMiembros] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const mencion = cerrado ? null : buscarMencion(valor, cursor)
  const sugerencias = mencion && miembros
    ? prepararMiembros(miembros, usuarioId).filter((m) => normalizar(m.nombre).includes(normalizar(mencion.busqueda)))
    : []

  useEffect(() => () => controlador.current?.abort(), [])

  function cargarMiembros() {
    if (estado !== 'inicial' && estado !== 'error') return
    const actual = new AbortController()
    controlador.current = actual
    setEstado('cargando')
    listarMiembros(proyectoId, actual.signal).then(
      (lista) => { if (!actual.signal.aborted) { setMiembros(lista); setEstado('listo') } },
      () => { if (!actual.signal.aborted) setEstado('error') },
    )
  }

  function actualizar(evento) {
    const texto = evento.target.value
    const posicion = evento.target.selectionStart
    onChange(texto)
    setCursor(posicion)
    setCerrado(false)
    setSeleccion(0)
    if (buscarMencion(texto, posicion) && estado === 'inicial') cargarMiembros()
  }

  function insertar(persona) {
    if (!mencion || persona.ambiguo) return
    // La coma delimita el alias completo para que el backend no tome texto posterior como parte de otro nombre.
    const insercion = `@${persona.nombre}, `
    const nuevo = valor.slice(0, mencion.inicio) + insercion + valor.slice(mencion.fin)
    const posicion = mencion.inicio + insercion.length
    onChange(nuevo)
    setCursor(posicion)
    setCerrado(true)
    campo.current?.focus()
    requestAnimationFrame(() => campo.current?.setSelectionRange(posicion, posicion))
  }

  function alTeclar(evento) {
    if (!mencion) return
    if (evento.key === 'Escape') { evento.preventDefault(); setCerrado(true) }
    if (!sugerencias.length) return
    if (evento.key === 'ArrowDown') { evento.preventDefault(); setSeleccion((actual) => (actual + 1) % sugerencias.length) }
    if (evento.key === 'ArrowUp') { evento.preventDefault(); setSeleccion((actual) => (actual + sugerencias.length - 1) % sugerencias.length) }
    if (evento.key === 'Enter' && !sugerencias[seleccion]?.ambiguo) { evento.preventDefault(); insertar(sugerencias[seleccion]) }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-texto">Escribí un comentario</label>
      <textarea id={id} ref={campo} value={valor} onChange={actualizar} onSelect={(evento) => setCursor(evento.currentTarget.selectionStart)} onKeyDown={alTeclar} disabled={disabled} rows={3} aria-describedby={`${id}-ayuda`} className="w-full rounded-md border border-borde bg-superficie p-3 text-texto focus-visible:outline-2 focus-visible:outline-primario" />
      <p id={`${id}-ayuda`} className="mt-1 text-xs text-texto-suave">Escribí @ para mencionar a alguien de la red.</p>
      {mencion && estado === 'cargando' && <p role="status" className="mt-2 text-sm text-texto-suave">Cargando miembros…</p>}
      {mencion && estado === 'error' && <div className="mt-2 text-sm text-error"><p role="alert">No pudimos cargar los miembros.</p><button type="button" onClick={cargarMiembros} className="min-h-11 font-semibold underline">Reintentar</button></div>}
      {mencion && estado === 'listo' && sugerencias.length > 0 && (
        <ul aria-label="Sugerencias de menciones" className="mt-2 max-h-48 overflow-y-auto rounded-md border border-borde bg-superficie">
          {sugerencias.map((persona, indice) => (
            <li key={persona.id}>
              <button type="button" disabled={persona.ambiguo} onMouseDown={(evento) => evento.preventDefault()} onClick={() => insertar(persona)} className={`min-h-11 w-full px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-primario disabled:text-texto-suave ${indice === seleccion ? 'bg-decoracion' : ''}`}>
                {persona.nombre}{persona.ambiguo && ' · Nombre repetido, no se puede mencionar con seguridad'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {mencion && estado === 'listo' && sugerencias.length === 0 && <p className="mt-2 text-sm text-texto-suave">No encontramos miembros con ese nombre.</p>}
    </div>
  )
}

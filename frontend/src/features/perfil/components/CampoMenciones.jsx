import { useId, useRef, useState } from 'react'

// Texto que se está escribiendo después de una @ (hasta el cursor), o null si no hay mención en curso
function mencionEnCurso(texto, cursor) {
  const antes = texto.slice(0, cursor)
  const encontrada = antes.match(/(?:^|\s)@([\p{L}\p{M}' ]{0,40})$/u)
  return encontrada ? { consulta: encontrada[1], inicio: cursor - encontrada[1].length - 1 } : null
}

const sinTildes = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// 6.2: un campo de texto donde, al escribir @, se sugieren los miembros de la red.
// Al elegir uno queda escrito "@Nombre Apellido", que es lo que el back reconoce para avisarle.
export default function CampoMenciones({ id, valor, onCambiar, miembros, etiqueta, disabled, maxLength }) {
  const area = useRef(null)
  const idLista = useId()
  const [mencion, setMencion] = useState(null)
  const [activa, setActiva] = useState(0)

  const sugerencias = mencion
    ? miembros
        .filter((miembro) => sinTildes(miembro.nombre).includes(sinTildes(mencion.consulta.trim())))
        .slice(0, 6)
    : []
  const abierta = sugerencias.length > 0

  function actualizar(texto, cursor) {
    onCambiar(texto)
    setMencion(mencionEnCurso(texto, cursor))
    setActiva(0)
  }

  function elegir(miembro) {
    const cursor = area.current?.selectionStart ?? valor.length
    const nuevo = `${valor.slice(0, mencion.inicio)}@${miembro.nombre} ${valor.slice(cursor)}`
    const posicion = mencion.inicio + miembro.nombre.length + 2
    onCambiar(nuevo)
    setMencion(null)
    requestAnimationFrame(() => {
      area.current?.focus()
      area.current?.setSelectionRange(posicion, posicion)
    })
  }

  function alTeclar(evento) {
    if (!abierta) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setActiva((actual) => (actual + 1) % sugerencias.length)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setActiva((actual) => (actual - 1 + sugerencias.length) % sugerencias.length)
    } else if (evento.key === 'Enter' || evento.key === 'Tab') {
      evento.preventDefault()
      elegir(sugerencias[activa])
    } else if (evento.key === 'Escape') {
      setMencion(null)
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <textarea
        ref={area}
        id={id}
        value={valor}
        onChange={(evento) => actualizar(evento.target.value, evento.target.selectionStart)}
        onKeyDown={alTeclar}
        onBlur={() => setTimeout(() => setMencion(null), 150)}
        placeholder="Escribí un comentario. Con @ mencionás a alguien de la red."
        rows={2}
        maxLength={maxLength}
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={abierta}
        aria-controls={abierta ? idLista : undefined}
        aria-activedescendant={abierta ? `${idLista}-${activa}` : undefined}
        className="w-full rounded-md border border-borde bg-superficie p-3 text-sm text-texto focus-visible:outline-2 focus-visible:outline-primario"
      />
      {abierta && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Miembros para mencionar"
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-borde bg-crema p-1 shadow-md"
        >
          {sugerencias.map((miembro, indice) => (
            <li
              key={miembro.id}
              id={`${idLista}-${indice}`}
              role="option"
              aria-selected={indice === activa}
              onMouseDown={(evento) => {
                evento.preventDefault()
                elegir(miembro)
              }}
              className={`cursor-pointer rounded-md px-3 py-2 text-sm ${indice === activa ? 'bg-decoracion font-semibold text-primario' : 'text-texto hover:bg-superficie'}`}
            >
              {miembro.nombre}
              {miembro.detalle && <span className="block text-xs font-normal text-texto-suave">{miembro.detalle}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

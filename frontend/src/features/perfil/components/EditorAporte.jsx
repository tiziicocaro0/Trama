import { useEffect, useRef, useState } from 'react'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import SelectorVisibilidad from '../../../components/ui/SelectorVisibilidad.jsx'
import { guardarAporte } from '../../../api/aportes.js'

// 2.1 y 2.2: campos propios que el back exige en "datos" para estos tipos.
// Arrancan en un valor neutro para no frenar la carga; se pueden cambiar.
const camposPorTipo = {
  INTERES: [
    {
      nombre: 'categoria',
      etiqueta: 'Categoría',
      inicial: 'OTRO',
      opciones: [
        ['JUEGO', 'Juego'],
        ['PERSONAJE', 'Personaje'],
        ['TEMA', 'Tema'],
        ['ACTIVIDAD', 'Actividad'],
        ['OBJETO', 'Objeto'],
        ['OTRO', 'Otro'],
      ],
    },
    {
      nombre: 'intensidad',
      etiqueta: 'Intensidad',
      inicial: 'MEDIA',
      opciones: [
        ['BAJA', 'Baja'],
        ['MEDIA', 'Media'],
        ['ALTA', 'Alta'],
      ],
    },
  ],
  FORTALEZA: [
    {
      nombre: 'contexto',
      etiqueta: '¿Dónde lo hace?',
      inicial: 'OTRO',
      opciones: [
        ['CASA', 'Casa'],
        ['ESCUELA', 'Escuela'],
        ['CONSULTORIO', 'Consultorio'],
        ['OTRO', 'Otro'],
      ],
    },
  ],
}

function leerDatos(texto) {
  try {
    const datos = JSON.parse(texto ?? '')
    return datos && typeof datos === 'object' && !Array.isArray(datos)
      ? datos
      : {}
  } catch {
    return {}
  }
}

export default function EditorAporte({
  seccion,
  proyectoId,
  aporte,
  alGuardar,
  alCancelar,
}) {
  const [titulo, setTitulo] = useState(aporte?.titulo ?? '')
  const [contenido, setContenido] = useState(aporte?.contenido ?? '')
  const [visibilidad, setVisibilidad] = useState(aporte?.visibilidad ?? 'TODOS')
  const campos = camposPorTipo[seccion.tipo] ?? []
  const [extra, setExtra] = useState(() => {
    const guardados = leerDatos(aporte?.datos)
    return {
      ...guardados,
      ...Object.fromEntries(
        campos.map(({ nombre, inicial }) => [
          nombre,
          guardados[nombre] ?? inicial,
        ]),
      ),
    }
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const formulario = useRef(null)
  const alerta = useRef(null)
  const esNota = seccion.tipo === 'NOTA_PROFESIONAL'
  const sustantivo = esNota ? 'nota' : 'aporte'
  useEffect(() => {
    formulario.current?.querySelector('input')?.focus()
  }, [])

  async function guardar(event) {
    event.preventDefault()
    if (pendiente.current) return
    if (
      !titulo.trim() ||
      titulo.trim().length > 150 ||
      contenido.length > 10000
    ) {
      setError(
        'Escribí un título de hasta 150 caracteres y una descripción de hasta 10000 caracteres.',
      )
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }
    pendiente.current = true
    setEnviando(true)
    setError('')
    try {
      await guardarAporte(proyectoId, aporte?.id, {
        tipo: seccion.tipo,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        visibilidad,
        ...(campos.length ? { datos: JSON.stringify(extra) } : {}),
      })
      alGuardar()
    } catch (errorGuardado) {
      setError(errorGuardado.message)
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  return (
    <form
      ref={formulario}
      onSubmit={guardar}
      noValidate
      aria-label={`${aporte ? 'Editar' : 'Agregar'} ${sustantivo} en ${seccion.titulo}`}
      aria-busy={enviando}
      className="mt-4 space-y-4 rounded-md border border-borde bg-bienvenida-luz p-4"
    >
      <p className="font-semibold text-secundario">
        {aporte
          ? `Editar ${sustantivo}`
          : esNota
            ? 'Nueva nota'
            : 'Nuevo aporte'}
      </p>
      <CampoFormulario
        id={`titulo-aporte-${seccion.tipo}`}
        label="Título"
        hint="Título (obligatorio, hasta 150 caracteres)"
      >
        <Campo
          name="titulo"
          placeholder="Título"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          maxLength={150}
          disabled={enviando}
        />
      </CampoFormulario>
      <div>
        <label
          htmlFor={`contenido-aporte-${seccion.tipo}`}
          className="mb-2 block font-semibold"
        >
          {esNota ? 'Texto de la nota (opcional)' : 'Descripción (opcional)'}
        </label>
        <textarea
          id={`contenido-aporte-${seccion.tipo}`}
          name="contenido"
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          maxLength={10000}
          rows={4}
          disabled={enviando}
          className="w-full rounded-md border border-borde bg-superficie p-4 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
      </div>
      {campos.map(({ nombre, etiqueta, opciones }) => (
        <div key={nombre}>
          <label
            htmlFor={`${nombre}-aporte-${seccion.tipo}`}
            className="mb-2 block font-semibold"
          >
            {etiqueta}
          </label>
          <select
            id={`${nombre}-aporte-${seccion.tipo}`}
            name={nombre}
            value={extra[nombre]}
            onChange={(event) =>
              setExtra((actual) => ({
                ...actual,
                [nombre]: event.target.value,
              }))
            }
            disabled={enviando}
            className="min-h-14 w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            {opciones.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      ))}
      <SelectorVisibilidad
        id={`visibilidad-aporte-${seccion.tipo}`}
        value={visibilidad}
        onChange={(event) => setVisibilidad(event.target.value)}
        disabled={enviando}
      />
      {error && (
        <p ref={alerta} tabIndex={-1} role="alert" className="text-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : `Guardar ${sustantivo}`}
        </Boton>
        <Boton variant="secondary" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

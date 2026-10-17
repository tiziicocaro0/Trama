import { useEffect, useRef, useState } from 'react'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import SelectorVisibilidad from '../../../components/ui/SelectorVisibilidad.jsx'
import { guardarAporte } from '../../../api/aportes.js'

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
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const formulario = useRef(null)
  const alerta = useRef(null)
  const esNota = seccion.tipo === 'NOTA'
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
      <FormField
        id={`titulo-aporte-${seccion.tipo}`}
        label="Título"
        hint="Título (obligatorio, hasta 150 caracteres)"
      >
        <Input
          name="titulo"
          placeholder="Título"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          maxLength={150}
          disabled={enviando}
        />
      </FormField>
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
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : `Guardar ${sustantivo}`}
        </Button>
        <Button variant="secondary" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

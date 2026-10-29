import { useEffect, useRef, useState } from 'react'
import { guardarAporte } from '../../../api/aportes.js'
import Boton from '../../../components/ui/Boton.jsx'
import SelectorVisibilidad from '../../../components/ui/SelectorVisibilidad.jsx'
import {
  CONTEXTOS_OBSERVACION,
  convertirFechaLocalAOffsetIso,
  ETIQUETAS_OBSERVACION,
  leerDatosObservacion,
  obtenerFechaHoraLocalActual,
} from '../bitacora.js'

export default function FormularioObservacion({
  proyectoId,
  observacion,
  alGuardar,
  alCancelar,
}) {
  const datosIniciales = leerDatosObservacion(observacion?.datos)
  const [fecha, setFecha] = useState(() =>
    datosIniciales.fecha
      ? obtenerFechaHoraLocalActual(new Date(datosIniciales.fecha))
      : obtenerFechaHoraLocalActual(),
  )
  const [contexto, setContexto] = useState(datosIniciales.contexto ?? '')
  const [etiquetas, setEtiquetas] = useState(datosIniciales.etiquetas ?? [])
  const [texto, setTexto] = useState(observacion?.contenido ?? '')
  const [visibilidad, setVisibilidad] = useState(
    observacion?.visibilidad ?? 'TODOS',
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const formulario = useRef(null)
  const alerta = useRef(null)

  useEffect(() => {
    formulario.current?.querySelector('input, select, textarea')?.focus()
  }, [])

  function alternarEtiqueta(codigo) {
    setEtiquetas((actuales) =>
      actuales.includes(codigo)
        ? actuales.filter((item) => item !== codigo)
        : [...actuales, codigo],
    )
  }

  async function manejarEnvio(event) {
    event.preventDefault()
    if (pendiente.current) return

    const fechaIso = convertirFechaLocalAOffsetIso(fecha)
    if (!fechaIso) {
      setError('Indicá una fecha y hora válidas para la observación.')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }
    if (!contexto) {
      setError('Elegí el contexto de la observación.')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }
    if (etiquetas.length === 0) {
      setError('Elegí al menos una etiqueta.')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }
    if (!texto.trim() || texto.length > 10000) {
      setError('Escribí el texto de la observación (hasta 10000 caracteres).')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }

    const textoLimpio = texto.trim()
    const tituloDerivado =
      observacion?.titulo?.trim() ||
      textoLimpio.split(/\r?\n/)[0].slice(0, 150)

    pendiente.current = true
    setEnviando(true)
    setError('')

    try {
      await guardarAporte(proyectoId, observacion?.id, {
        tipo: 'OBSERVACION',
        titulo: tituloDerivado,
        contenido: textoLimpio,
        datos: JSON.stringify({
          fecha: fechaIso,
          contexto,
          etiquetas,
        }),
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
      onSubmit={manejarEnvio}
      noValidate
      aria-label={observacion ? 'Editar observación' : 'Nueva observación'}
      aria-busy={enviando}
      className="mb-6 space-y-4 rounded-md border border-borde bg-bienvenida-luz p-4 sm:p-6"
    >
      <h2 className="font-display text-h2 text-secundario">
        {observacion ? 'Editar observación' : 'Nueva observación'}
      </h2>

      <div>
        <label
          htmlFor="fecha-observacion"
          className="mb-2 block font-semibold"
        >
          Fecha y hora
        </label>
        <input
          id="fecha-observacion"
          name="fecha"
          type="datetime-local"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          required
          disabled={enviando}
          className="min-h-14 w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
      </div>

      <div>
        <label
          htmlFor="contexto-observacion"
          className="mb-2 block font-semibold"
        >
          Contexto
        </label>
        <select
          id="contexto-observacion"
          name="contexto"
          value={contexto}
          onChange={(event) => setContexto(event.target.value)}
          required
          disabled={enviando}
          className="min-h-14 w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        >
          <option value="">Seleccioná un contexto</option>
          {CONTEXTOS_OBSERVACION.map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 block font-semibold">
          Etiquetas (elegí al menos una)
        </legend>
        <div className="flex flex-wrap gap-2">
          {ETIQUETAS_OBSERVACION.map(([codigo, etiqueta]) => {
            const activa = etiquetas.includes(codigo)
            return (
              <label
                key={codigo}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activa
                    ? 'border-primario bg-primario text-superficie'
                    : 'border-borde bg-superficie text-texto hover:bg-decoracion'
                }`}
              >
                <input
                  type="checkbox"
                  name="etiquetas"
                  value={codigo}
                  checked={activa}
                  onChange={() => alternarEtiqueta(codigo)}
                  disabled={enviando}
                  className="sr-only"
                />
                <span>{etiqueta}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="texto-observacion"
          className="mb-2 block font-semibold"
        >
          Texto de la observación
        </label>
        <textarea
          id="texto-observacion"
          name="texto"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          maxLength={10000}
          rows={4}
          required
          disabled={enviando}
          placeholder="Contá qué pasó, en qué situación y qué ayudó…"
          className="w-full rounded-md border border-borde bg-superficie p-4 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
      </div>

      <SelectorVisibilidad
        id="visibilidad-observacion"
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
          {enviando ? 'Guardando…' : 'Guardar observación'}
        </Boton>
        <Boton variant="secondary" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}


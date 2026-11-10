import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { guardarAporte } from '../../api/aportes.js'
import Boton from '../../components/ui/Boton.jsx'
import {
  CONTEXTOS_OBSERVACION,
  convertirFechaLocalAOffsetIso,
  obtenerFechaHoraLocalActual,
} from './bitacora.js'

export default function CargarObservacionSimplePage() {
  const { id } = useParams()
  const navegar = useNavigate()

  const [contexto, setContexto] = useState('')
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pendiente = useRef(false)
  const alerta = useRef(null)

  async function manejarEnvio(event) {
    event.preventDefault()

    if (pendiente.current) return

    if (!contexto) {
      setError('Elegí dónde ocurrió.')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }

    const textoLimpio = texto.trim()

    if (!textoLimpio || textoLimpio.length > 10000) {
      setError('Contá brevemente qué pasó.')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }

    const fechaActual = obtenerFechaHoraLocalActual()
    const fechaIso = convertirFechaLocalAOffsetIso(fechaActual)

    pendiente.current = true
    setEnviando(true)
    setError('')

    try {
      await guardarAporte(id, null, {
        tipo: 'OBSERVACION',
        titulo: textoLimpio.split(/\r?\n/)[0].slice(0, 150),
        contenido: textoLimpio,
        datos: JSON.stringify({
          fecha: fechaIso,
          contexto,
          etiquetas: ['OTRO'],
        }),
        visibilidad: 'TODOS',
      })

      navegar(`/proyectos/${id}`, {
        replace: true,
        state: {
          mensaje: 'Observación guardada.',
        },
      })
    } catch (errorGuardado) {
      setError(errorGuardado.message)
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-8">
      <section className="rounded-lg border border-borde bg-superficie p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primario">
            Vista simple
          </p>

          <h1 className="mt-2 font-display text-h1 text-secundario">
            Cargar observación
          </h1>

          <p className="mt-2 text-base leading-relaxed text-texto-suave">
            Contá algo que pasó. Solo necesitamos saber dónde ocurrió y qué observaste.
          </p>
        </div>

        <form onSubmit={manejarEnvio} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="contexto-observacion-simple"
              className="mb-2 block text-lg font-semibold text-texto"
            >
              ¿Dónde pasó?
            </label>

            <select
              id="contexto-observacion-simple"
              value={contexto}
              onChange={(event) => setContexto(event.target.value)}
              disabled={enviando}
              className="min-h-14 w-full rounded-md border border-borde bg-fondo px-4 py-3 text-lg text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              <option value="">Seleccioná una opción</option>

              {CONTEXTOS_OBSERVACION.map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="texto-observacion-simple"
              className="mb-2 block text-lg font-semibold text-texto"
            >
              ¿Qué pasó?
            </label>

            <textarea
              id="texto-observacion-simple"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              disabled={enviando}
              maxLength={10000}
              rows={6}
              placeholder="Por ejemplo: hoy pudo entrar al aula sin ayuda y se quedó tranquilo..."
              className="w-full rounded-md border border-borde bg-fondo p-4 text-lg leading-relaxed text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            />
          </div>

          {error && (
            <p
              ref={alerta}
              tabIndex={-1}
              role="alert"
              className="text-error"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Boton type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar observación'}
            </Boton>

            <Boton
              type="button"
              variant="secondary"
              disabled={enviando}
              onClick={() => navegar(`/proyectos/${id}`)}
            >
              Cancelar
            </Boton>
          </div>
        </form>
      </section>
    </main>
  )
}
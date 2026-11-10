import { useEffect, useRef, useState } from 'react'
import { guardarAporte } from '../../../api/aportes.js'
import Boton from '../../../components/ui/Boton.jsx'
import PreguntaGuia from '../../../components/ui/PreguntaGuia.jsx'
import {
  CONTEXTOS_OBSERVACION,
  convertirFechaLocalAOffsetIso,
  obtenerFechaHoraLocalActual,
} from '../bitacora.js'

const LARGO_MAXIMO = 2000

const CAMPOS_ABC = [
  {
    nombre: 'antecedente',
    label: 'Antes',
    ayuda: '¿Qué estaba pasando justo antes?',
    placeholder: 'Ej. Sonó el timbre del recreo sin aviso.',
  },
  {
    nombre: 'conducta',
    label: 'Qué pasó',
    ayuda: '¿Qué hizo o cómo reaccionó?',
    placeholder: 'Ej. Se tapó los oídos y buscó salir del aula.',
  },
  {
    nombre: 'consecuencia',
    label: 'Después',
    ayuda: '¿Qué pasó después y qué ayudó?',
    placeholder: 'Ej. Salimos al patio unos minutos y se calmó.',
  },
]

const CLASE_CAMPO =
  'w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

export default function FormularioAbc({ proyectoId, alGuardar, alCancelar }) {
  const [fecha, setFecha] = useState(() => obtenerFechaHoraLocalActual())
  const [contexto, setContexto] = useState('')
  const [textos, setTextos] = useState({
    antecedente: '',
    conducta: '',
    consecuencia: '',
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const formulario = useRef(null)
  const alerta = useRef(null)

  useEffect(() => {
    formulario.current?.querySelector('textarea')?.focus()
  }, [])

  function mostrarError(mensaje) {
    setError(mensaje)
    requestAnimationFrame(() => alerta.current?.focus())
  }

  async function manejarEnvio(event) {
    event.preventDefault()
    if (pendiente.current) return

    const limpios = {
      antecedente: textos.antecedente.trim(),
      conducta: textos.conducta.trim(),
      consecuencia: textos.consecuencia.trim(),
    }
    const faltante = CAMPOS_ABC.find((campo) => !limpios[campo.nombre])
    if (faltante) {
      mostrarError(`Completá el campo "${faltante.label}".`)
      return
    }
    if (!contexto) {
      mostrarError('Elegí dónde pasó.')
      return
    }
    const fechaIso = convertirFechaLocalAOffsetIso(fecha)
    if (!fechaIso) {
      mostrarError('Indicá una fecha y hora válidas.')
      return
    }

    pendiente.current = true
    setEnviando(true)
    setError('')

    try {
      await guardarAporte(proyectoId, null, {
        tipo: 'ABC',
        titulo: limpios.antecedente.split(/\r?\n/)[0].slice(0, 150),
        contenido: limpios.conducta,
        datos: JSON.stringify({ ...limpios, fecha: fechaIso, contexto }),
        visibilidad: 'TODOS',
      })
      alGuardar()
    } catch (errorGuardado) {
      mostrarError(errorGuardado.message)
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
      aria-label="Registro ABC"
      aria-busy={enviando}
      className="mb-6 space-y-4 rounded-md border border-borde bg-bienvenida-luz p-4 sm:p-6"
    >
      <div>
        <h2 className="font-display text-h2 text-secundario">Registro ABC</h2>
        <p className="mt-1 text-texto-suave">
          Contá qué pasó antes, durante y después. Lo ve toda la red.
        </p>
      </div>

      {/* 2.9: una pregunta guía y un ejemplo, en positivo */}
      <PreguntaGuia tipo="ABC" />

      {CAMPOS_ABC.map((campo) => (
        <div key={campo.nombre}>
          <label
            htmlFor={`abc-${campo.nombre}`}
            className="block text-lg font-semibold"
          >
            {campo.label}
          </label>
          <p id={`abc-${campo.nombre}-ayuda`} className="mb-2 text-sm text-texto-suave">
            {campo.ayuda}
          </p>
          <textarea
            id={`abc-${campo.nombre}`}
            name={campo.nombre}
            aria-describedby={`abc-${campo.nombre}-ayuda`}
            value={textos[campo.nombre]}
            onChange={(event) =>
              setTextos((actuales) => ({
                ...actuales,
                [campo.nombre]: event.target.value,
              }))
            }
            maxLength={LARGO_MAXIMO}
            rows={4}
            required
            disabled={enviando}
            placeholder={campo.placeholder}
            className={`${CLASE_CAMPO} text-lg`}
          />
        </div>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="abc-contexto" className="mb-2 block font-semibold">
            Dónde pasó
          </label>
          <select
            id="abc-contexto"
            name="contexto"
            value={contexto}
            onChange={(event) => setContexto(event.target.value)}
            required
            disabled={enviando}
            className={`min-h-14 ${CLASE_CAMPO}`}
          >
            <option value="">Seleccioná un lugar</option>
            {CONTEXTOS_OBSERVACION.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="abc-fecha" className="mb-2 block font-semibold">
            Fecha y hora
          </label>
          <input
            id="abc-fecha"
            name="fecha"
            type="datetime-local"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            required
            disabled={enviando}
            className={`min-h-14 ${CLASE_CAMPO}`}
          />
        </div>
      </div>

      {error && (
        <p ref={alerta} tabIndex={-1} role="alert" className="text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar registro'}
        </Boton>
        <Boton variant="secondary" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}


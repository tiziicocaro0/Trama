import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import {
  ESPECIALIDADES_EDUCACION,
  ESPECIALIDADES_SALUD,
} from '../especialidades.js'

function esOtra(valor) {
  return valor === 'OTRA_EDUCACION' || valor === 'OTRA_SALUD'
}

export default function EspecialidadModal({
  abierto,
  onCerrar,
  onGuardar,
  rol,
  especialidadesActuales = [],
}) {
  const opciones =
    rol === 'EDUCACION' ? ESPECIALIDADES_EDUCACION : ESPECIALIDADES_SALUD

  // Estado inicial: las especialidades actuales del miembro
  const [seleccionadas, setSeleccionadas] = useState(() => {
    const mapa = new Map()
    especialidadesActuales.forEach((item) => {
      mapa.set(item.especialidad, item.aclaracion ?? '')
    })
    return mapa
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function alternarEspecialidad(valor) {
    setSeleccionadas((actual) => {
      const copia = new Map(actual)
      if (copia.has(valor)) {
        copia.delete(valor)
      } else {
        copia.set(valor, '')
      }
      return copia
    })
  }

  function cambiarAclaracion(valor, texto) {
    setSeleccionadas((actual) => {
      const copia = new Map(actual)
      copia.set(valor, texto)
      return copia
    })
  }

  function validar() {
    if (seleccionadas.size === 0) {
      return 'Seleccioná al menos una especialidad.'
    }
    if (seleccionadas.size > 10) {
      return 'Podés seleccionar hasta 10 especialidades.'
    }
    for (const [valor, aclaracion] of seleccionadas) {
      if (esOtra(valor) && !aclaracion.trim()) {
        return 'Indicá tu especialidad en el campo de aclaración cuando elegís "Otra".'
      }
      if (aclaracion.length > 120) {
        return 'La aclaración no puede superar los 120 caracteres.'
      }
    }
    return null
  }

  async function manejarGuardar() {
    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setGuardando(true)
    setError('')
    try {
      const lista = []
      for (const [especialidad, aclaracion] of seleccionadas) {
        lista.push({
          especialidad,
          aclaracion: aclaracion.trim() || null,
        })
      }
      await onGuardar(lista)
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        'No pudimos guardar las especialidades. Intentá nuevamente.'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Mis especialidades"
      onCerrar={() => {
        if (!guardando) onCerrar()
      }}
    >
      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
        {error && <Aviso tipo="error">{error}</Aviso>}

        <p className="text-sm text-texto-suave">
          Seleccioná una o más especialidades y, si querés, agregá una
          aclaración con tu título exacto.
        </p>

        <fieldset className="space-y-3">
          <legend className="sr-only">
            Especialidades de {rol === 'EDUCACION' ? 'educación' : 'salud'}
          </legend>
          {opciones.map((opcion) => {
            const marcada = seleccionadas.has(opcion.valor)
            const inputId = `esp-${opcion.valor}`
            const aclaracionId = `acl-${opcion.valor}`
            return (
              <div key={opcion.valor} className="space-y-2">
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternarEspecialidad(opcion.valor)}
                    disabled={guardando}
                    className="size-5 shrink-0 accent-primario"
                  />
                  <span className="text-base">{opcion.etiqueta}</span>
                </label>
                {marcada && (
                  <div className="ml-8">
                    <label
                      htmlFor={aclaracionId}
                      className="mb-1 block text-sm text-texto-suave"
                    >
                      Aclaración{esOtra(opcion.valor) ? ' (obligatoria)' : ' (opcional)'}
                    </label>
                    <input
                      id={aclaracionId}
                      type="text"
                      maxLength={120}
                      placeholder="Ej: Lic. en Psicología Clínica"
                      value={seleccionadas.get(opcion.valor) ?? ''}
                      onChange={(e) =>
                        cambiarAclaracion(opcion.valor, e.target.value)
                      }
                      disabled={guardando}
                      className="w-full rounded-md border border-borde bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Boton
          variant="secondary"
          onClick={onCerrar}
          disabled={guardando}
        >
          Cancelar
        </Boton>
        <Boton
          onClick={manejarGuardar}
          disabled={guardando || seleccionadas.size === 0}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </div>
    </Modal>
  )
}

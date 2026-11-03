import { useEffect, useState } from 'react'
import { listarVersiones } from '../../../api/aportes.js'
import { Modal } from '../../../components/ui/Modal.jsx'
import { formatearFechaHora } from '../../../utils/fechas.js'
import { leerDatosAporte } from '../perfil.js'
import { CATEGORIAS_SENSORIALES, CONTEXTOS_SENSORIALES, CATEGORIAS_ESTRATEGIA, CONTEXTOS_ESTRATEGIA, RESULTADOS_ESTRATEGIA } from '../camposAporte.js'

function cambios(version, anterior) {
  if (!anterior) return []
  const nombres = []
  if (version.titulo !== anterior.titulo) nombres.push('título')
  if (version.contenido !== anterior.contenido) nombres.push('descripción')
  const actual = leerDatosAporte(version.datos)
  const previo = leerDatosAporte(anterior.datos)
  for (const [campo, etiqueta] of [['lista', 'lista'], ['categoria', 'categoría'], ['contexto', 'contexto'], ['situacion', 'situación'], ['resultado', 'resultado'], ['contextos', 'contextos'], ['formasComunicacion', 'formas de comunicación'], ['otraForma', 'otra forma'], ['comoHablarle', 'cómo hablarle'], ['queEvitar', 'qué evitar']]) {
    if (JSON.stringify(actual[campo]) !== JSON.stringify(previo[campo])) nombres.push(etiqueta)
  }
  return nombres
}

// 3.2: versiones de un aporte, de la más nueva a la más vieja. Solo lectura.
export default function HistorialAporte({ proyectoId, aporte, onCerrar }) {
  const [versiones, setVersiones] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    listarVersiones(proyectoId, aporte.id)
      .then((lista) => {
        if (vigente) setVersiones(lista)
      })
      .catch((errorCarga) => {
        if (vigente) setError(errorCarga.message)
      })
    return () => {
      vigente = false
    }
  }, [proyectoId, aporte.id])

  return (
    <Modal abierto titulo={`Historial: ${aporte.titulo}`} onCerrar={onCerrar}>
      {error ? (
        <p role="alert" className="text-error">
          {error}
        </p>
      ) : !versiones ? (
        <p role="status">Cargando el historial…</p>
      ) : (
        <>
          {versiones.length === 1 && (
            <p className="mb-3 text-sm text-texto-suave">
              Este aporte todavía no tiene ediciones.
            </p>
          )}
          <ol
            aria-label="Versiones del aporte"
            className="max-h-96 space-y-3 overflow-y-auto pr-1"
          >
            {versiones.map((version, indice) => (
              <li
                key={version.numero}
                className="rounded-md border border-borde bg-superficie p-3"
              >
                <p className="text-xs font-semibold text-secundario">
                  {version.actual
                    ? `Versión ${version.numero} · actual`
                    : `Versión ${version.numero}`}
                </p>
                <p className="mt-1 font-semibold text-texto">{version.titulo}</p>
                {cambios(version, versiones[indice + 1]).length > 0 && <p className="mt-1 text-sm text-secundario">Se modificaron: {cambios(version, versiones[indice + 1]).join(', ')}</p>}
                {version.contenido && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-texto-suave">
                    {version.contenido}
                  </p>
                )}
                {aporte.tipo === 'COMUNICACION' && Object.entries(leerDatosAporte(version.datos)).filter(([clave]) => ['categoria', 'formasComunicacion', 'otraForma', 'comoHablarle', 'queEvitar'].includes(clave)).map(([clave, valor]) => <p key={clave} className="mt-1 break-words text-sm text-texto-suave">{({ categoria: 'Categoría', formasComunicacion: 'Formas de comunicación', otraForma: 'Otra forma', comoHablarle: 'Cómo conviene hablarle', queEvitar: 'Qué evitar' })[clave]}: {Array.isArray(valor) ? valor.join(', ') : valor}</p>)}
                {aporte.tipo === 'SENSORIAL' && Object.entries(leerDatosAporte(version.datos)).filter(([clave]) => ['lista', 'categoria', 'contexto'].includes(clave)).map(([clave, valor]) => <p key={clave} className="mt-1 break-words text-sm text-texto-suave">{({ lista: 'Lista', categoria: 'Categoría', contexto: 'Contexto' })[clave]}: {clave === 'lista' ? ({ AYUDA: 'Le ayuda', CUESTA: 'Le cuesta' })[valor] : clave === 'categoria' ? CATEGORIAS_SENSORIALES.find(([codigo]) => codigo === valor)?.[1] : CONTEXTOS_SENSORIALES.find(([codigo]) => codigo === valor)?.[1]}</p>)}
                {aporte.tipo === 'ESTRATEGIA' && Object.entries(leerDatosAporte(version.datos)).filter(([clave]) => ['categoria', 'situacion', 'resultado', 'contextos'].includes(clave)).map(([clave, valor]) => <p key={clave} className="mt-1 break-words text-sm text-texto-suave">{({ categoria: 'Categoría', situacion: 'En qué situación', resultado: 'Resultado', contextos: 'Dónde suele funcionar' })[clave]}: {clave === 'categoria' ? CATEGORIAS_ESTRATEGIA.find(([codigo]) => codigo === valor)?.[1] : clave === 'resultado' ? RESULTADOS_ESTRATEGIA.find(([codigo]) => codigo === valor)?.[1] : clave === 'contextos' ? valor.map((codigo) => CONTEXTOS_ESTRATEGIA.find(([item]) => item === codigo)?.[1]).filter(Boolean).join(', ') : valor}</p>)}
                <p className="mt-2 text-xs text-texto-suave">
                  {version.autorNombre && `${version.autorNombre} · `}
                  <time dateTime={version.fechaCreacion}>
                    {formatearFechaHora(version.fechaCreacion)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </Modal>
  )
}

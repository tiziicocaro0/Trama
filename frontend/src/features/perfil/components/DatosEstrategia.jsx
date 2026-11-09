import { CATEGORIAS_ESTRATEGIA, CONTEXTOS_ESTRATEGIA, ICONOS_ESTRATEGIA, RESULTADOS_ESTRATEGIA, TONOS_ESTRATEGIA, etiquetaOpcion } from '../camposAporte.js'

export default function DatosEstrategia({ datos, parte }) {
  if (parte === 'categoria') {
    const categoria = CATEGORIAS_ESTRATEGIA.find(([valor]) => valor === datos.categoria)?.[1]
    const Icono = ICONOS_ESTRATEGIA[datos.categoria]
    return categoria && <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-secundario">{Icono && <span className={`inline-flex size-10 items-center justify-center rounded-sm ${TONOS_ESTRATEGIA[datos.categoria]}`}><Icono size={24} aria-hidden="true" /></span>}{categoria}</p>
  }
  const resultado = RESULTADOS_ESTRATEGIA.find(([valor]) => valor === datos.resultado)?.[1]
  const contextos = Array.isArray(datos.contextos) ? datos.contextos.map((valor) => etiquetaOpcion(CONTEXTOS_ESTRATEGIA, valor, datos.contextoOtro)).filter(Boolean) : []
  return (
    <div className="mt-2 space-y-1 text-sm text-texto-suave">
      {datos.situacion && <p className="whitespace-pre-wrap break-words"><strong className="text-texto">En qué situación:</strong> {datos.situacion}</p>}
      {resultado && <p><strong className="text-texto">Resultado:</strong> {resultado}</p>}
      {contextos.length > 0 && <p><strong className="text-texto">Dónde suele funcionar:</strong> {contextos.join(', ')}</p>}
    </div>
  )
}

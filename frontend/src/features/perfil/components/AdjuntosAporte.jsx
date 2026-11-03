import SubirArchivo from '../../../components/ui/SubirArchivo.jsx'

export default function AdjuntosAporte({ proyectoId, archivos, onChange, disabled, sensorial, estrategia }) {
  return (
    <div>
      {sensorial && <p className="mb-2 text-sm text-texto-suave">Adjuntá imágenes, pictogramas o materiales concretos. Este espacio no es para informes profesionales extensos.</p>}
      {estrategia && <p className="mb-2 text-sm text-texto-suave">Adjuntá solo material que complemente la estrategia, como un pictograma, una secuencia visual o una plantilla. Los informes extensos van en Notas.</p>}
      <SubirArchivo proyectoId={proyectoId} archivos={archivos} onChange={onChange} disabled={disabled} />
    </div>
  )
}

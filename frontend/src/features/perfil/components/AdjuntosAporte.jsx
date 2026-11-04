import SubirArchivo from '../../../components/ui/SubirArchivo.jsx'

export default function AdjuntosAporte({ proyectoId, archivos, onChange, disabled, sensorial, estrategia, rutina }) {
  return (
    <div>
      {sensorial && <p className="mb-2 text-sm text-texto-suave">Adjuntá imágenes, pictogramas o materiales concretos. Este espacio no es para informes profesionales extensos.</p>}
      {estrategia && <p className="mb-2 text-sm text-texto-suave">Adjuntá solo material que complemente la estrategia, como un pictograma, una secuencia visual o una plantilla. Los informes extensos van en Notas.</p>}
      {rutina && <p className="mb-2 text-sm text-texto-suave">Adjuntá una secuencia visual, pictograma, imagen de apoyo o material usado en la rutina. Los informes y documentos extensos van en Notas profesionales.</p>}
      <SubirArchivo proyectoId={proyectoId} archivos={archivos} onChange={onChange} disabled={disabled} />
    </div>
  )
}

import EditorFoto from '../../../components/ui/EditorFoto.jsx'
import { subirFotoProyecto } from '../../../api/fotos.js'
import useFotoNino from '../useFotoNino.js'
import FotoNino from './FotoNino.jsx'

const TAMANO = 'size-16 sm:size-20'
const ICONO = 'bg-primario text-superficie'

// Foto del niño en la cabecera del perfil. El tutor administrador la cambia con el lápiz.
export default function FotoNinoCabecera({ proyecto, editable = false, onCambio }) {
  const src = useFotoNino(proyecto)
  if (!editable) {
    return <FotoNino proyecto={proyecto} className={TAMANO} claseIcono={ICONO} tamanoIcono={36} />
  }
  return (
    <EditorFoto
      src={src}
      nombre={proyecto.nombre}
      tituloRecorte={`Foto de ${proyecto.nombre}`}
      className={TAMANO}
      claseIcono={ICONO}
      tamanoIcono={36}
      onGuardar={async (imagen) => {
        await subirFotoProyecto(proyecto.id, imagen)
        onCambio?.()
      }}
    />
  )
}

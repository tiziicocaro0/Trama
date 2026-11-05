import EditorFoto from '../../../components/ui/EditorFoto.jsx'
import { quitarFotoProyecto, subirFotoProyecto } from '../../../api/fotos.js'
import useFotoNino from '../useFotoNino.js'

// Datos personales: el tutor administrador elige, recorta y cambia la foto del niño.
export default function FotoNinoEditable({ proyecto, onCambio }) {
  const src = useFotoNino(proyecto)
  return (
    <section
      aria-labelledby="titulo-foto-nino"
      className="mt-6 rounded-lg bg-superficie p-5 shadow-sm sm:p-8"
    >
      <h2 id="titulo-foto-nino" className="mb-4 font-display text-h2 text-secundario">
        Foto
      </h2>
      <EditorFoto
        src={src}
        nombre={proyecto.nombre}
        tituloRecorte={`Foto de ${proyecto.nombre}`}
        onGuardar={async (imagen) => {
          await subirFotoProyecto(proyecto.id, imagen)
          onCambio()
        }}
        onQuitar={async () => {
          await quitarFotoProyecto(proyecto.id)
          onCambio()
        }}
      />
    </section>
  )
}

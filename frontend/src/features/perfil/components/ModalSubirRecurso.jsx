import { useState } from 'react'
import { avisar } from '../../../components/avisos/avisosFlotantes.js'
import { Modal } from '../../../components/ui/Modal.jsx'
import SelectorVisibilidad from '../../../components/ui/SelectorVisibilidad.jsx'
import SubirArchivo from '../../../components/ui/SubirArchivo.jsx'

// Primero se elige quién lo ve; al elegir el archivo se sube con esa visibilidad.
export default function ModalSubirRecurso({ proyectoId, onCerrar, onSubido }) {
  const [visibilidad, setVisibilidad] = useState('TODOS')

  function alSubir(archivos) {
    if (archivos.length === 0) return
    avisar('Listo. Subimos el recurso.')
    onSubido()
  }

  return (
    <Modal abierto titulo="Subir recurso" onCerrar={onCerrar}>
      <div className="space-y-5">
        <p className="text-texto-suave">
          Un PDF o una foto para compartir con la red: un pictograma, una agenda visual, un informe.
        </p>
        <SelectorVisibilidad
          id="visibilidad-recurso"
          value={visibilidad}
          onChange={(evento) => setVisibilidad(evento.target.value)}
          leyenda="¿Quién puede ver este recurso?"
        />
        <SubirArchivo
          proyectoId={proyectoId}
          visibilidad={visibilidad}
          onChange={alSubir}
          etiqueta="Archivo"
        />
      </div>
    </Modal>
  )
}

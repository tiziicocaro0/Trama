import { useState } from 'react'
import Interruptor from '../../components/ui/Interruptor.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

export function SeccionInterruptores() {
  const [cargar, setCargar] = useState(true)
  const [notas, setNotas] = useState(false)

  return (
    <Tarjeta titulo="Interruptores">
      <div className="space-y-4">
        <Interruptor id="vitrina-cargar" checked={cargar} onChange={(e) => setCargar(e.target.checked)} etiqueta="Los familiares pueden cargar información" descripcion="Prendido" />
        <Interruptor id="vitrina-notas" checked={notas} onChange={(e) => setNotas(e.target.checked)} etiqueta="Los familiares ven las notas profesionales" descripcion="Apagado" />
        <Interruptor id="vitrina-bloqueado" checked disabled onChange={() => {}} etiqueta="Avisos de invitaciones" descripcion="Deshabilitado: siempre activo" />
      </div>
    </Tarjeta>
  )
}

import { useState } from 'react'
import Boton from '../../../components/ui/Boton.jsx'
import { cerrarAvisoCambioPaquete } from '../../../api/instituciones.js'

const MOTIVOS = {
  NINOS: 'el cupo de niños',
  PROFESIONALES: 'el cupo de profesionales',
}

// 9.3: cartel flotante con el cambio automático de paquete. Es un aviso de prueba
// hasta que exista la campana de notificaciones (6.0).
export default function AvisoCambioPaquete({ aviso, paqueteActual, onCerrado }) {
  const [error, setError] = useState('')

  async function cerrar() {
    setError('')
    try {
      onCerrado(await cerrarAvisoCambioPaquete())
    } catch (problema) {
      setError(problema.message)
    }
  }

  return (
    <aside
      role="status"
      aria-labelledby="titulo-aviso-paquete"
      className="fixed right-4 bottom-4 left-4 z-40 space-y-3 rounded-lg border border-miel bg-superficie p-5 shadow-lg sm:left-auto sm:max-w-sm"
    >
      <p className="inline-block rounded-sm bg-miel/20 px-2 py-1 text-xs font-bold text-oliva">
        Aviso de prueba
      </p>
      <h2 id="titulo-aviso-paquete" className="font-display text-2xl text-terracota">
        Pasaste al paquete {paqueteActual}
      </h2>
      <p>
        Superaste {MOTIVOS[aviso.motivo]} del paquete {aviso.paqueteAnterior},
        así que cambiamos de paquete para no bloquear a nadie.
      </p>
      <p className="text-sm text-texto-suave">
        Cuando estén las notificaciones de Trama, este aviso te va a llegar ahí.
      </p>
      {error && <p role="alert" className="text-error">{error}</p>}
      <Boton onClick={cerrar}>Entendido</Boton>
    </aside>
  )
}

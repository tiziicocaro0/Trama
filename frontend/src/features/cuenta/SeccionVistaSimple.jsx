import { useState } from 'react'
import { actualizarVistaSimple } from '../../api/cuenta.js'
import Interruptor from '../../components/ui/Interruptor.jsx'

// 7.0: menos opciones y botones grandes en el perfil de cada niño. Queda guardado en la cuenta.
export default function SeccionVistaSimple({ usuario, onCambio }) {
  const [activa, setActiva] = useState(Boolean(usuario?.vistaSimple))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function cambiar(evento) {
    const valor = evento.target.checked
    setActiva(valor)
    setGuardando(true)
    setError('')
    try {
      await actualizarVistaSimple(valor)
      onCambio?.()
    } catch {
      setActiva(!valor)
      setError('No pudimos guardar el cambio. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-vista-simple" className="rounded-lg bg-superficie p-6 shadow-sm">
      <h2 id="titulo-vista-simple" className="mb-4 font-display text-h2 text-secundario">Cómo ver TRAMA</h2>
      <Interruptor
        id="vista-simple"
        etiqueta="Vista simple"
        descripcion="En el perfil de cada niño vas a ver solo cuatro botones grandes: Conocelo, Si se desregula, Hoy y Cargar observación."
        checked={activa}
        onChange={cambiar}
        disabled={guardando}
      />
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </section>
  )
}

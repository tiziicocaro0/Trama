import { useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import { formatearPesos } from '../planes.js'

// 9.1 y 9.2: pantalla de pago SIMULADA, con el recorrido de un checkout de Mercado Pago.
// No pide ni guarda datos de tarjeta: al confirmar solo se activa el plan.
export default function PagoSimulado({ abierto, concepto, monto, onConfirmar, onCerrar }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    setEnviando(true)
    setError('')
    try {
      await onConfirmar()
    } catch (problema) {
      setError(problema.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto={abierto} titulo="Pago de prueba" onCerrar={onCerrar}>
      <div className="space-y-5">
        <Aviso tipo="alerta">
          Esto es un pago de prueba: no se cobra nada y no se guarda ninguna
          tarjeta.
        </Aviso>
        <dl className="space-y-3 rounded-lg border border-borde bg-superficie p-4">
          <div className="flex justify-between gap-4">
            <dt className="text-texto-suave">Concepto</dt>
            <dd className="text-right font-semibold">{concepto}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-texto-suave">Total</dt>
            <dd className="text-right font-semibold">{formatearPesos(monto)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-texto-suave">Medio de pago</dt>
            <dd className="text-right">Mercado Pago (simulado)</dd>
          </div>
        </dl>
        {error && <p role="alert" className="text-error">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Boton onClick={confirmar} disabled={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar pago de prueba'}
          </Boton>
          <Boton variant="secondary" onClick={onCerrar} disabled={enviando}>
            Volver
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

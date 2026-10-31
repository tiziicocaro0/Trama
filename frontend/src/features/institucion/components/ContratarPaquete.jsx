import { useId, useState } from 'react'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import { Tarjeta } from '../../../components/ui/Tarjeta.jsx'
import { contratarPaquete } from '../../../api/instituciones.js'
import PagoSimulado from '../../plan/components/PagoSimulado.jsx'
import { describirCupo, formatearPesos } from '../../plan/planes.js'

// 9.2: elegir un paquete y contratarlo con el pago de prueba.
export default function ContratarPaquete({ paquetes, onContratado }) {
  const campoId = useId()
  const [nombre, setNombre] = useState('')
  const [elegido, setElegido] = useState(null)
  const [error, setError] = useState('')

  function elegir(paquete) {
    if (!nombre.trim()) {
      setError('Ingresá el nombre de la institución antes de elegir un paquete.')
      return
    }
    setError('')
    setElegido(paquete)
  }

  async function pagar() {
    const institucion = await contratarPaquete({ nombre, paqueteId: elegido.id })
    setElegido(null)
    onContratado(institucion)
  }

  return (
    <section aria-labelledby="titulo-contratar" className="space-y-5">
      <div>
        <h2 id="titulo-contratar" className="font-display text-h2 text-secundario">
          Contratá un paquete para tu institución
        </h2>
        <p className="mt-2 text-texto-suave">
          Los profesionales que asocies editan en todos sus niños sin usar su
          límite gratuito. Vos no vas a ver los perfiles de los niños.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor={campoId} className="font-semibold">
          Nombre de la institución
        </label>
        <Campo
          id={campoId}
          value={nombre}
          maxLength={120}
          onChange={(evento) => setNombre(evento.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${campoId}-error` : undefined}
        />
        {error && (
          <p id={`${campoId}-error`} role="alert" className="text-error">
            {error}
          </p>
        )}
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {paquetes.map((paquete) => (
          <li key={paquete.id}>
            <Tarjeta titulo={paquete.nombre} className="h-full">
              <p className="text-subtitulo font-bold">
                {formatearPesos(paquete.precioArs)}{' '}
                <span className="text-base font-normal text-texto-suave">por mes</span>
              </p>
              <ul className="mt-3 space-y-1 text-texto-suave">
                <li>{describirCupo(paquete.cupoNinos, 'niño', 'niños')}</li>
                <li>{describirCupo(paquete.cupoProfesionales, 'profesional', 'profesionales')}</li>
              </ul>
              <Boton className="mt-4" onClick={() => elegir(paquete)}>
                Contratar {paquete.nombre}
              </Boton>
            </Tarjeta>
          </li>
        ))}
      </ul>
      {elegido && (
        <PagoSimulado
          abierto
          concepto={`Paquete ${elegido.nombre} · ${nombre.trim()}`}
          monto={elegido.precioArs}
          onConfirmar={pagar}
          onCerrar={() => setElegido(null)}
        />
      )}
    </section>
  )
}

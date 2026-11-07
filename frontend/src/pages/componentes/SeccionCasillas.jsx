import { useState } from 'react'
import CasillaOvillo from '../../components/ui/CasillaOvillo.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

const FORMAS = ['Verbal', 'Pictogramas', 'Gestos', 'Señas']

// Casillas de TRAMA: al marcarlas, el ovillo entra rodando
export function SeccionCasillas() {
  const [soloMios, setSoloMios] = useState(true)
  const [aviso, setAviso] = useState(false)
  const [formas, setFormas] = useState(['Pictogramas'])

  const alternar = (forma) =>
    setFormas((actual) => (actual.includes(forma) ? actual.filter((f) => f !== forma) : [...actual, forma]))

  return (
    <Tarjeta titulo="Casillas con ovillo">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-oliva">Normal</p>
          <CasillaOvillo checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)}>Solo mis aportes</CasillaOvillo>
          <CasillaOvillo checked={aviso} onChange={(e) => setAviso(e.target.checked)}>Avisarme por mail</CasillaOvillo>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-oliva">Deshabilitada y con error</p>
          <CasillaOvillo checked disabled onChange={() => {}}>Marcada y deshabilitada</CasillaOvillo>
          <CasillaOvillo checked={false} invalida onChange={() => {}}>Acepto los términos (obligatoria)</CasillaOvillo>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold text-oliva">Chica, dentro de una pastilla (tamano=&quot;chico&quot;)</p>
          <div className="flex flex-wrap gap-2">
            {FORMAS.map((forma) => (
              <CasillaOvillo
                key={forma}
                tamano="chico"
                className="rounded-full border border-borde bg-superficie px-3 py-2 has-checked:border-primario has-checked:bg-fondo"
                checked={formas.includes(forma)}
                onChange={() => alternar(forma)}
              >
                {forma}
              </CasillaOvillo>
            ))}
          </div>
        </div>
      </div>
    </Tarjeta>
  )
}

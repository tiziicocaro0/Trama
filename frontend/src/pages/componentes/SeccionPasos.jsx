import Pasos from '../../components/ui/Pasos.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

const ETAPAS = ['Datos', 'Seguridad', 'Perfil']

// El indicador de etapas del registro, en sus tres estados
export function SeccionPasos() {
  return (
    <Tarjeta titulo="Pasos">
      <div className="space-y-6">
        <Pasos steps={ETAPAS} current={0} label="Ejemplo: primera etapa" />
        <Pasos steps={ETAPAS} current={2} label="Ejemplo: última etapa" />
        <Pasos steps={ETAPAS} current={2} complete label="Ejemplo: completo" />
      </div>
    </Tarjeta>
  )
}

import { Link } from 'react-router-dom'
import { Aviso } from '../../components/ui/Aviso.jsx'

// 9.0: aviso para el profesional que está en solo lectura por el límite del plan gratuito.
// Las familias nunca lo ven: el back solo marca soloLecturaPorPlan en educación y salud.
export default function AvisoPlanGratuito() {
  return (
    <Aviso tipo="alerta">
      Con el plan gratuito podés editar en 2 niños. Suscribite para editar en
      todos.{' '}
      <Link
        to="/cuenta/plan"
        className="font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
      >
        Ver planes
      </Link>
    </Aviso>
  )
}

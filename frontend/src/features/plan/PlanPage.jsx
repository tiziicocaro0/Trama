import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import Boton from '../../components/ui/Boton.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta.jsx'
import { formatearFechaCalendario } from '../../utils/fechas.js'
import { cancelarSuscripcion, suscribirse } from '../../api/planes.js'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import PagoSimulado from './components/PagoSimulado.jsx'
import useMiPlan from './hooks/useMiPlan.js'
import { NOMBRES_PLAN, describirPeriodo, formatearPesos } from './planes.js'

// 9.1: /cuenta/plan. Las familias solo ven que Trama es gratis: nunca precios ni pagos.
export default function PlanPage() {
  const { cerrarSesion } = useAuth()
  const { plan, error, cargando, reintentar, actualizar } = useMiPlan()
  const [elegido, setElegido] = useState(null)
  const [confirmarBaja, setConfirmarBaja] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorBaja, setErrorBaja] = useState('')

  async function pagar() {
    const nuevo = await suscribirse(elegido.periodo)
    actualizar(nuevo)
    setElegido(null)
    setMensaje('¡Listo! Tu suscripción está activa: ya podés editar en todos tus niños.')
  }

  async function darDeBaja() {
    setErrorBaja('')
    try {
      actualizar(await cancelarSuscripcion())
      setConfirmarBaja(false)
      setMensaje('Cancelaste la suscripción. Volviste al plan gratuito.')
    } catch (problema) {
      setErrorBaja(problema.message)
    }
  }

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-plan" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-plan"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <h1 className="font-display text-h1 text-secundario sm:text-display">
              Mi plan
            </h1>
          </header>
          {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
          {cargando ? (
            <p role="status">Cargando tu plan…</p>
          ) : error ? (
            <div className="space-y-4 rounded-lg bg-superficie p-6">
              <p role="alert">{error}</p>
              <Boton onClick={reintentar}>Reintentar</Boton>
            </div>
          ) : !plan.esProfesional ? (
            <Tarjeta titulo="Tu cuenta es gratuita">
              <p>Trama es gratis para las familias, siempre.</p>
            </Tarjeta>
          ) : plan.plan === 'INSTITUCIONAL' ? (
            <Tarjeta titulo={NOMBRES_PLAN.INSTITUCIONAL}>
              <p>
                La licencia de {plan.institucion} te cubre: editás en todos tus
                niños.
              </p>
            </Tarjeta>
          ) : (
            <>
              <Tarjeta titulo={NOMBRES_PLAN[plan.plan]}>
                {plan.plan === 'GRATUITO' ? (
                  <p>
                    Podés editar en tus {plan.proyectosGratuitos} primeros
                    niños. En los demás, consultás todo en modo lectura.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p>
                      Editás en todos tus niños. Vigente hasta el{' '}
                      {formatearFechaCalendario(plan.hasta)}.
                    </p>
                    <Boton variant="secondary" onClick={() => setConfirmarBaja(true)}>
                      Cancelar suscripción
                    </Boton>
                  </div>
                )}
              </Tarjeta>
              {plan.plan === 'GRATUITO' && (
                <section aria-labelledby="titulo-planes" className="space-y-4">
                  <h2 id="titulo-planes" className="font-display text-h2 text-secundario">
                    Suscribite para editar en todos tus niños
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {plan.planes.map((opcion) => (
                      <li key={opcion.periodo}>
                        <Tarjeta titulo={NOMBRES_PLAN[opcion.periodo]}>
                          <p className="text-subtitulo font-bold">
                            {formatearPesos(opcion.precioArs)}{' '}
                            <span className="text-base font-normal text-texto-suave">
                              {describirPeriodo(opcion)}
                            </span>
                          </p>
                          <Boton className="mt-4" onClick={() => setElegido(opcion)}>
                            Suscribirme
                          </Boton>
                        </Tarjeta>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
          {plan && (plan.esProfesional || plan.esResponsable) && (
            <p>
              <Link
                to="/institucion"
                className="font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                {plan.esResponsable
                  ? 'Administrar mi institución'
                  : '¿Representás a una institución? Conocé los paquetes'}
              </Link>
            </p>
          )}
          <Link
            to="/acompanamientos"
            className="inline-flex min-h-11 items-center rounded-sm text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Volver a acompañamientos
          </Link>
        </div>
      </main>
      {elegido && (
        <PagoSimulado
          abierto
          concepto={NOMBRES_PLAN[elegido.periodo]}
          monto={elegido.precioArs}
          onConfirmar={pagar}
          onCerrar={() => setElegido(null)}
        />
      )}
      <Modal
        abierto={confirmarBaja}
        titulo="Cancelar suscripción"
        onCerrar={() => setConfirmarBaja(false)}
      >
        <div className="space-y-4">
          <p>
            Vas a volver al plan gratuito: vas a poder editar solo en tus 2
            primeros niños.
          </p>
          {errorBaja && <p role="alert" className="text-error">{errorBaja}</p>}
          <div className="flex flex-wrap gap-3">
            <Boton variant="danger" onClick={darDeBaja}>
              Sí, cancelar
            </Boton>
            <Boton variant="secondary" onClick={() => setConfirmarBaja(false)}>
              Volver
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

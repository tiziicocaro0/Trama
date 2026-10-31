import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import Boton from '../components/ui/Boton.jsx'
import { invitacionPendiente } from '../features/invitaciones/invitacionPendiente.js'

// abierto: la página sirve con o sin sesión (1.4: el enlace de una invitación).
export default function Acceso({ privado = false, abierto = false, children }) {
  const { usuario, estado, mensajeSesion, reintentar, cerrarSesion } = useAuth()
  if (estado === 'verificando' || estado === 'sin-conexion') {
    return (
      <main
        tabIndex={-1}
        className="flex min-h-svh flex-col items-center justify-center gap-6 bg-superficie p-6 text-center text-texto"
      >
        {estado === 'verificando' ? (
          <p role="status">Verificando tu sesión…</p>
        ) : (
          <>
            <p role="alert">{mensajeSesion}</p>
            <Boton onClick={reintentar}>Reintentar conexión</Boton>
            <Boton variant="secondary" onClick={() => cerrarSesion()}>
              Volver al inicio de sesión
            </Boton>
          </>
        )}
      </main>
    )
  }
  if (privado && !usuario) return <Navigate to="/login" replace />
  if (abierto) return children
  // 1.4: quien ingresa desde el enlace de una invitación vuelve a ella.
  if (!privado && usuario)
    return <Navigate to={invitacionPendiente() ?? '/inicio'} replace />
  return children
}

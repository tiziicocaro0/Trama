import { Navigate } from 'react-router'
import useAuth from '../hooks/useAuth.js'
import Button from '../components/ui/Button.jsx'

export default function Acceso({ privado = false, children }) {
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
            <Button onClick={reintentar}>Reintentar conexión</Button>
            <Button variant="secondary" onClick={() => cerrarSesion()}>
              Volver al inicio de sesión
            </Button>
          </>
        )}
      </main>
    )
  }
  if (privado && !usuario) return <Navigate to="/login" replace />
  if (!privado && usuario) return <Navigate to="/inicio" replace />
  return children
}

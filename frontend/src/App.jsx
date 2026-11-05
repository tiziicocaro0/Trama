import AppRoutes from './routes/AppRoutes.jsx'
import AvisosFlotantes from './components/avisos/AvisosFlotantes.jsx'
import NotificacionesGlobales from './features/notificaciones/NotificacionesGlobales.jsx'

// Punto de entrada de las rutas. El AuthProvider se monta en main.jsx.
export function App() {
  return (
    <>
      <AppRoutes />
      <NotificacionesGlobales />
      <AvisosFlotantes />
    </>
  )
}
export default App
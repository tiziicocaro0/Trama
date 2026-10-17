import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import BienvenidaPage from '../features/bienvenida/BienvenidaPage.jsx'
import PaginaTemporal from '../features/auth/PaginaTemporal.jsx'
import RegistroPage from '../features/auth/registro/RegistroPage.jsx'
import LoginPage from '../features/auth/login/LoginPage.jsx'
import InicioPage from '../features/inicio/InicioPage.jsx'
import Acceso from './Acceso.jsx'

const titles = {
  '/': 'Bienvenida',
  '/login': 'Iniciar sesión',
  '/registro': 'Crear cuenta',
  '/inicio': 'Inicio',
}

export default function AppRoutes() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `TRAMA · ${titles[pathname] ?? 'Página no encontrada'}`
    document.querySelector('main')?.focus()
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<BienvenidaPage />} />
      <Route
        path="/login"
        element={
          <Acceso>
            <LoginPage />
          </Acceso>
        }
      />
      <Route
        path="/registro"
        element={
          <Acceso>
            <RegistroPage />
          </Acceso>
        }
      />
      <Route
        path="/inicio"
        element={
          <Acceso privado>
            <InicioPage />
          </Acceso>
        }
      />
      <Route
        path="*"
        element={<PaginaTemporal title="Página no encontrada" />}
      />
    </Routes>
  )
}

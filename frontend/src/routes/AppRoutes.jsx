import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import BienvenidaPage from '../features/bienvenida/BienvenidaPage.jsx'
import PaginaTemporal from '../features/auth/PaginaTemporal.jsx'
import RegistroPage from '../features/auth/registro/RegistroPage.jsx'
import LoginPage from '../features/auth/login/LoginPage.jsx'
import InicioPage from '../features/inicio/InicioPage.jsx'
import Acceso from './Acceso.jsx'
import PerfilPage from '../features/perfil/PerfilPage.jsx'
import { seccionesPerfil } from '../features/perfil/perfil.js'
import AcompanamientosPage from '../features/acompanamientos/AcompanamientosPage.jsx'
import NuevoAcompanamientoPage from '../features/acompanamientos/NuevoAcompanamientoPage.jsx'
import RedPage from '../features/perfil/RedPage.jsx'
import DatosPersonalesPage from '../features/perfil/DatosPersonalesPage.jsx'

const titles = {
  '/': 'Bienvenida',
  '/login': 'Iniciar sesión',
  '/registro': 'Crear cuenta',
  '/inicio': 'Inicio',
  '/acompanamientos': 'Acompañamientos',
  '/acompanamientos/nuevo': 'Nuevo acompañamiento',
}

export default function AppRoutes() {
  const { pathname } = useLocation()

  useEffect(() => {
    const perfil = /^\/proyectos\/[^/]+(?:\/([^/]+))?\/?$/.exec(pathname)
    const seccion = seccionesPerfil.find((item) => item.slug === perfil?.[1])
    const espaciosPerfil = {
      red: 'Red',
      'datos-personales': 'Datos personales',
      notas: 'Notas',
    }
    const espacio = Object.hasOwn(espaciosPerfil, perfil?.[1])
      ? espaciosPerfil[perfil[1]]
      : null
    const tituloPerfil =
      perfil && (!perfil[1] || seccion || espacio)
        ? (espacio ?? seccion?.titulo ?? 'Perfil del niño')
        : null
    document.title = `TRAMA · ${titles[pathname] ?? tituloPerfil ?? 'Página no encontrada'}`
    document.querySelector('main')?.focus()
  }, [pathname])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Acceso>
            <BienvenidaPage />
          </Acceso>
        }
      />
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
        path="/acompanamientos"
        element={
          <Acceso privado>
            <AcompanamientosPage />
          </Acceso>
        }
      />
      <Route
        path="/acompanamientos/nuevo"
        element={
          <Acceso privado>
            <NuevoAcompanamientoPage />
          </Acceso>
        }
      />
      <Route
        path="/proyectos/:id"
        element={
          <Acceso privado>
            <PerfilPage />
          </Acceso>
        }
      />
      <Route
        path="/proyectos/:id/red"
        element={
          <Acceso privado>
            <RedPage />
          </Acceso>
        }
      />
      <Route
        path="/proyectos/:id/datos-personales"
        element={
          <Acceso privado>
            <DatosPersonalesPage />
          </Acceso>
        }
      />
      <Route
        path="/proyectos/:id/:seccion"
        element={
          <Acceso privado>
            <PerfilPage />
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

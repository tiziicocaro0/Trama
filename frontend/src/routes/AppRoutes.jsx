import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BienvenidaPage from '../features/bienvenida/BienvenidaPage.jsx'
import PaginaTemporal from '../features/auth/PaginaTemporal.jsx'
import RegistroPage from '../features/auth/registro/RegistroPage.jsx'
import LoginPage from '../features/auth/login/LoginPage.jsx'
import RecuperarPage from '../features/auth/recuperar/RecuperarPage.jsx'
import InicioPage from '../features/inicio/InicioPage.jsx'
import Acceso from './Acceso.jsx'
import PerfilPage from '../features/perfil/PerfilPage.jsx'
import { seccionesPerfil } from '../features/perfil/perfil.js'
import AcompanamientosPage from '../features/acompanamientos/AcompanamientosPage.jsx'
import NuevoAcompanamientoPage from '../features/acompanamientos/NuevoAcompanamientoPage.jsx'
import RedPage from '../features/perfil/RedPage.jsx'
import DatosPersonalesPage from '../features/perfil/DatosPersonalesPage.jsx'
import ConoceloPage from '../features/perfil/ConoceloPage.jsx'
import BitacoraPage from '../features/bitacora/BitacoraPage.jsx'
import PlanPage from '../features/plan/PlanPage.jsx'
import { Layout } from '../components/layout/Layout.jsx'
import { Tarjeta } from '../components/ui/Tarjeta.jsx'
import { Componentes } from '../pages/Componentes.jsx'

const titles = {
  '/': 'Bienvenida',
  '/login': 'Iniciar sesión',
  '/recuperar': 'Recuperar contraseña',
  '/registro': 'Crear cuenta',
  '/inicio': 'Inicio',
  '/acompanamientos': 'Acompañamientos',
  '/acompanamientos/nuevo': 'Nuevo acompañamiento',
  '/recursos': 'Recursos',
  '/calendario': 'Calendario',
  '/perfil': 'Mi perfil',
  '/cuenta/plan': 'Mi plan',
  '/componentes': 'Componentes',
}

function Proximamente({ titulo }) {
  return <Tarjeta titulo={titulo}>Próximamente</Tarjeta>
}

export default function AppRoutes() {
  const { pathname } = useLocation()

  useEffect(() => {
    const perfil = /^\/proyectos\/[^/]+(?:\/([^/]+))?\/?$/.exec(pathname)
    const seccion = seccionesPerfil.find((item) => item.slug === perfil?.[1])
    const espaciosPerfil = {
      conocelo: 'Conocelo en 5 minutos',
      red: 'Red',
      miembros: 'Red',
      'datos-personales': 'Datos personales',
      notas: 'Notas',
      bitacora: 'Bitácora',
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
        path="/recuperar"
        element={
          <Acceso>
            <RecuperarPage />
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
        path="/cuenta/plan"
        element={
          <Acceso privado>
            <PlanPage />
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
        path="/proyectos/:id/conocelo"
        element={
          <Acceso privado>
            <ConoceloPage />
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
        path="/proyectos/:id/bitacora"
        element={
          <Acceso privado>
            <BitacoraPage />
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
      {/* Mis proyectos (1.10) vive en /acompanamientos, como en el mockup */}
      <Route path="/proyectos" element={<Navigate to="/acompanamientos" replace />} />
      <Route
        path="/proyectos/nuevo"
        element={<Navigate to="/acompanamientos/nuevo" replace />}
      />
      {import.meta.env.DEV && <Route path="/componentes" element={<Componentes />} />}
      <Route element={<Acceso privado><Layout /></Acceso>}>
        <Route path="/recursos" element={<Proximamente titulo="Recursos" />} />
        <Route path="/calendario" element={<Proximamente titulo="Calendario" />} />
        <Route path="/perfil" element={<Proximamente titulo="Mi perfil" />} />
      </Route>
      <Route
        path="*"
        element={<PaginaTemporal title="Página no encontrada" />}
      />
    </Routes>
  )
}

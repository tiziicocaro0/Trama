import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Tarjeta } from '../components/ui/Tarjeta';
import PaginaTemporal from '../features/auth/PaginaTemporal.jsx';
import LoginPage from '../features/auth/login/LoginPage.jsx';
import RecuperarPage from '../features/auth/recuperar/RecuperarPage.jsx';
import RegistroPage from '../features/auth/registro/RegistroPage.jsx';
import RestablecerPage from '../features/auth/restablecer/RestablecerPage.jsx';
import BienvenidaPage from '../features/bienvenida/BienvenidaPage.jsx';
import InicioPage from '../features/inicio/InicioPage.jsx';
import { Componentes } from '../pages/Componentes';
import { MisProyectos } from '../pages/MisProyectos';
import Acceso from './Acceso.jsx';

const titulos = {
  '/': 'Bienvenida',
  '/login': 'Iniciar sesión',
  '/recuperar': 'Recuperar contraseña',
  '/registro': 'Crear cuenta',
  '/restablecer': 'Restablecer contraseña',
  '/inicio': 'Inicio',
  '/proyectos': 'Mis proyectos',
};

function Proximamente({ titulo }) {
  return <Tarjeta titulo={titulo}>Próximamente</Tarjeta>;
}

export default function AppRoutes() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `TRAMA · ${titulos[pathname] ?? 'TRAMA'}`;
    document.querySelector('main')?.focus();
  }, [pathname]);

  return (
    <Routes>
      {/* Públicas */}
      <Route
        path="/"
        element={<BienvenidaPage />}
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
        path="/restablecer"
        element={
          <Acceso>
            <RestablecerPage />
          </Acceso>
        }
      />
      {import.meta.env.DEV && (
        <Route path="/componentes" element={<Componentes />} />
      )}

      {/* Inicio (pantalla inicial de Sofía): tiene su propio diseño */}
      <Route
        path="/inicio"
        element={
          <Acceso privado>
            <InicioPage />
          </Acceso>
        }
      />

      {/* Privadas: requieren sesión y usan el layout común */}
      <Route
        element={
          <Acceso privado>
            <Layout />
          </Acceso>
        }
      >
        <Route path="/proyectos" element={<MisProyectos />} />
        <Route
          path="/proyectos/nuevo"
          element={<Proximamente titulo="Nuevo perfil" />}
        />
        <Route
          path="/proyectos/:id"
          element={<Proximamente titulo="Portada del proyecto" />}
        />
        <Route path="/recursos" element={<Proximamente titulo="Recursos" />} />
        <Route
          path="/calendario"
          element={<Proximamente titulo="Calendario" />}
        />
        <Route path="/perfil" element={<Proximamente titulo="Mi perfil" />} />
      </Route>

      <Route
        path="*"
        element={<PaginaTemporal title="Página no encontrada" />}
      />
    </Routes>
  );
}

import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Tarjeta } from './components/ui/Tarjeta';
import { useAuth } from './hooks/useAuth';
import { Componentes } from './pages/Componentes';
import { MisProyectos } from './pages/MisProyectos';

function RutaProtegida() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      {import.meta.env.DEV && <Route path="/componentes" element={<Componentes />} />}
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/proyectos" replace />} />
          <Route path="/proyectos" element={<MisProyectos />} />
          <Route
            path="/proyectos/nuevo"
            element={<Tarjeta titulo="Nuevo perfil">Próximamente</Tarjeta>}
          />
          <Route
            path="/proyectos/:id"
            element={<Tarjeta titulo="Portada del proyecto">Próximamente</Tarjeta>}
          />
          <Route path="/recursos" element={<Tarjeta titulo="Recursos">Próximamente</Tarjeta>} />
          <Route path="/calendario" element={<Tarjeta titulo="Calendario">Próximamente</Tarjeta>} />
          <Route path="/perfil" element={<Tarjeta titulo="Mi perfil">Próximamente</Tarjeta>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/proyectos" replace />} />
    </Routes>
  );
}

export default App;

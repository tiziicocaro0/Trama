import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MisProyectos from './pages/MisProyectos';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/proyectos" replace />} />
        <Route path="/proyectos" element={<MisProyectos />} />
        <Route path="/proyectos/nuevo" element={<p className="p-6">Crear perfil (pendiente)</p>} />
        <Route path="/proyectos/:id" element={<p className="p-6">Portada del proyecto (pendiente)</p>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import AuthProvider from './features/auth/AuthProvider.jsx';
import VistaSimpleProvider from './features/perfil/VistaSimpleProvider.jsx'
import './styles/tema.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VistaSimpleProvider>
          <App />
        </VistaSimpleProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

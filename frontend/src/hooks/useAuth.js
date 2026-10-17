import { useContext } from 'react';
import AuthContext from '../features/auth/AuthContext.js';

// Usuario ficticio para los datos mock de proyectos y los tests.
export const USUARIO_MOCK = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Zoe',
  email: 'zoe@ejemplo.com',
};

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth requiere AuthProvider.');
  return auth;
}

export default useAuth;

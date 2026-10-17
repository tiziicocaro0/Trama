export interface UsuarioAuth {
  id: string;
  nombre: string;
  email: string;
}

export const USUARIO_MOCK: UsuarioAuth = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Zoe',
  email: 'zoe@ejemplo.com',
};

/**
 * Mock de sesión estático: asume que el usuario ya inició sesión.
 * La pantalla y lógica real de Login corresponden a otra tarea del sprint.
 */
export function useAuth() {
  return {
    usuario: USUARIO_MOCK,
    isAuthenticated: true,
    autenticado: true,
    login: () => {},
    logout: () => {},
  };
}

export default useAuth;

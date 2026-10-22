import axios from 'axios';

// Base única del front: Axios + token. Une la base de Maxi (0.14) con la
// sesión de Zoe (1.1). Un 401 avisa al AuthProvider para cerrar la sesión.

let tokenActual = null;
const observadores = new Set();

export function alRechazarSesion(observador) {
  observadores.add(observador);
  return () => observadores.delete(observador);
}

// Decisión de Zoe (1.1): el token vive solo en memoria por seguridad.
// Al recargar la página hay que volver a iniciar sesión.
export function guardarToken(token) {
  tokenActual = token;
}

export function obtenerToken() {
  return tokenActual;
}

export const clienteApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

clienteApi.interceptors.request.use((config) => {
  if (
    tokenActual &&
    ![
      '/auth/registro',
      '/auth/login',
      '/auth/recuperar',
      '/auth/verificar-codigo',
      '/auth/restablecer',
    ].includes(config.url)
  ) {
    config.headers.set('Authorization', `Bearer ${tokenActual}`);
  }
  return config;
});

clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const autorizacion = error.config?.headers?.get?.('Authorization');
    if (
      error.response?.status === 401 &&
      tokenActual &&
      autorizacion === `Bearer ${tokenActual}`
    ) {
      guardarToken(null);
      observadores.forEach((observador) => observador());
    }
    return Promise.reject(error);
  },
);

export default clienteApi;

import axios from 'axios';

// Base única del front: Axios + token. Une la base de Maxi (0.14) con la
// sesión de Zoe (1.1). Un 401 avisa al AuthProvider para cerrar la sesión.

const CLAVE_SESION = 'trama.sesion';

// El navegador puede bloquear el almacenamiento (modo privado, cookies apagadas):
// en ese caso la sesión sigue funcionando, solo que en memoria.
function almacenes() {
  try {
    return [window.localStorage, window.sessionStorage];
  } catch {
    return [];
  }
}

function leerTokenGuardado() {
  for (const almacen of almacenes()) {
    try {
      const token = almacen.getItem(CLAVE_SESION);
      if (token) return token;
    } catch {
      // Se ignora: sin almacenamiento, no hay sesión guardada.
    }
  }
  return null;
}

let tokenActual = leerTokenGuardado();
const observadores = new Set();

export function alRechazarSesion(observador) {
  observadores.add(observador);
  return () => observadores.delete(observador);
}

// El token se guarda en el navegador para que recargar no cierre la sesión.
// Sin "Mantener sesión iniciada" va a sessionStorage y muere al cerrar la
// pestaña; con la casilla va a localStorage y dura hasta que vence (8 h).
// Un token vencido se descarta al abrir TRAMA (AuthProvider) y un 401 lo borra.
export function guardarToken(token, { recordar = false } = {}) {
  tokenActual = token;
  for (const almacen of almacenes()) {
    try {
      almacen.removeItem(CLAVE_SESION);
    } catch {
      // Se ignora: sin almacenamiento, la sesión queda solo en memoria.
    }
  }
  if (!token) return;
  try {
    (recordar ? window.localStorage : window.sessionStorage).setItem(
      CLAVE_SESION,
      token,
    );
  } catch {
    // Se ignora: sin almacenamiento, la sesión queda solo en memoria.
  }
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

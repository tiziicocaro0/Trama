import { clienteApi } from './cliente.js';

// Obtener las últimas 10 notificaciones.
export async function obtenerNotificaciones() {
  const respuesta = await clienteApi.get('/notificaciones');
  return respuesta.data;
}

// Obtener la cantidad de notificaciones sin leer.
export async function contarNotificacionesNoLeidas() {
  const respuesta = await clienteApi.get(
    '/notificaciones/no-leidas/count'
  );
  return respuesta.data;
}

// Marcar una notificación como leída.
export async function marcarNotificacionLeida(id) {
  await clienteApi.put(
    `/notificaciones/${encodeURIComponent(id)}/leida`
  );
}

// Marcar todas las notificaciones como leídas.
export async function marcarTodasLeidas() {
  await clienteApi.put('/notificaciones/leer-todas');
}
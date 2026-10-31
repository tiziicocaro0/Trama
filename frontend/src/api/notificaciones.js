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
// 6.1: qué avisos llegan también por mail (un interruptor por tipo).
export async function obtenerPreferenciasNotificacion(signal) {
  const { data } = await clienteApi.get('/notificaciones/preferencias', { signal });
  if (
    !Array.isArray(data) ||
    data.some((item) => typeof item?.tipo !== 'string' || typeof item?.porEmail !== 'boolean')
  ) {
    throw new Error('No pudimos leer tus preferencias de notificaciones.');
  }
  return data;
}

// 6.1: cambia uno o varios interruptores; devuelve todos como quedaron.
export async function guardarPreferenciasNotificacion(cambios) {
  const { data } = await clienteApi.put('/notificaciones/preferencias', cambios);
  return data;
}

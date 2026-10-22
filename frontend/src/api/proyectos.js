import { USUARIO_MOCK } from '../hooks/useAuth';
import { clienteApi } from './cliente';
export const PROYECTOS_MOCK = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Tomás',
    apodo: 'Tomi',
    foto: null,
    iniciales: 'TO',
    tono: 'terracota',
    rol: 'Madre',
    edad: '6 años',
    actualizado: 'Actualizado hoy',
    tieneActualizacionPendiente: true,
    miembrosIds: [USUARIO_MOCK.id],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Martina',
    apodo: null,
    foto: null,
    iniciales: 'MA',
    tono: 'agua',
    rol: 'Terapeuta',
    edad: '4 años',
    actualizado: 'Actualizado ayer',
    tieneActualizacionPendiente: false,
    miembrosIds: [USUARIO_MOCK.id],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Joaquín',
    apodo: 'Joaco',
    foto: null,
    iniciales: 'JO',
    tono: 'oliva',
    rol: 'Docente',
    edad: '8 años',
    actualizado: 'Actualizado hace 3 días',
    tieneActualizacionPendiente: false,
    miembrosIds: [USUARIO_MOCK.id],
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nombre: 'Lucía',
    apodo: 'Luli',
    foto: null,
    iniciales: 'LU',
    tono: 'miel',
    rol: 'Docente',
    edad: '5 años',
    actualizado: 'Actualizado hace 5 días',
    tieneActualizacionPendiente: false,
    miembrosIds: ['00000000-0000-0000-0000-000000000099'],
  },
];
export function filtrarProyectosPorMiembro(proyectos, usuarioId) {
  return proyectos.filter(
    (proyecto) =>
      !proyecto.miembrosIds || proyecto.miembrosIds.includes(usuarioId),
  );
}
/**
 * Consulta `GET /api/proyectos` mediante `clienteApi` (Axios).
 * Si el backend no está disponible en desarrollo, utiliza `PROYECTOS_MOCK`
 * y filtra estrictamente los proyectos donde `usuarioId` es miembro.
 */
export async function obtenerMisProyectos(usuarioId) {
  try {
    const { data } = await clienteApi.get('/proyectos');
    return filtrarProyectosPorMiembro(data, usuarioId);
  } catch {
    return filtrarProyectosPorMiembro(PROYECTOS_MOCK, usuarioId);
  }
}

export const MIEMBROS_MOCK = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    nombre: 'Marta Fernández',
    iniciales: 'MF',
    tono: 'terracota',
    rol: 'Tutora administradora',
    detalle: 'Madre',
    esAdmin: true,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    nombre: 'María Díaz',
    iniciales: 'MD',
    tono: 'oliva',
    rol: 'Educación',
    detalle: 'Docente · 3.º grado',
    esAdmin: false,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    nombre: 'Diego Torres',
    iniciales: 'DT',
    tono: 'agua',
    rol: 'Salud',
    detalle: 'Psicología · MN 12345',
    esAdmin: false,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    nombre: 'Elena Sosa',
    iniciales: 'ES',
    tono: 'miel',
    rol: 'Familiar',
    detalle: 'Abuela',
    esAdmin: false,
  },
];

/**
 * Revoca el acceso de un miembro al proyecto mediante `DELETE /api/proyectos/{id}/miembros/{miembroId}`.
 */
export async function quitarMiembroProyecto(proyectoId, miembroId) {
  return clienteApi.delete(`/proyectos/${proyectoId}/miembros/${miembroId}`);
}


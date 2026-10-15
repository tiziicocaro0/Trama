export type RolProyecto = 'Madre' | 'Padre' | 'Terapeuta' | 'Docente' | 'Familiar';

export type TonoAvatar = 'terracota' | 'agua' | 'oliva' | 'miel';

export interface Proyecto {
  id: string;
  nombre: string;
  apodo: string | null;
  /** URL de la foto; si es null se muestra la inicial/iniciales sobre un color. */
  foto: string | null;
  iniciales: string;
  tono: TonoAvatar;
  rol: RolProyecto;
  edad: string;
  actualizado: string;
  tieneActualizacionPendiente: boolean;
}

export interface Usuario {
  nombre: string;
}

/** Respuesta de `GET /api/proyectos`. */
export interface MisProyectosResponse {
  usuario: Usuario;
  proyectos: Proyecto[];
}

const RESPUESTA_MOCK: MisProyectosResponse = {
  usuario: { nombre: 'Zoe' },
  proyectos: [
    {
      id: '1',
      nombre: 'Tomás',
      apodo: 'Tomi',
      foto: null,
      iniciales: 'TO',
      tono: 'terracota',
      rol: 'Madre',
      edad: '6 años',
      actualizado: 'Actualizado hoy',
      tieneActualizacionPendiente: true,
    },
    {
      id: '2',
      nombre: 'Martina',
      apodo: null,
      foto: null,
      iniciales: 'MA',
      tono: 'agua',
      rol: 'Terapeuta',
      edad: '4 años',
      actualizado: 'Actualizado ayer',
      tieneActualizacionPendiente: false,
    },
    {
      id: '3',
      nombre: 'Joaquín',
      apodo: 'Joaco',
      foto: null,
      iniciales: 'JO',
      tono: 'oliva',
      rol: 'Docente',
      edad: '8 años',
      actualizado: 'Actualizado hace 3 días',
      tieneActualizacionPendiente: false,
    },
  ],
};

/**
 * Mock de `GET /api/proyectos`: devuelve el usuario dueño de la cuenta y sólo los
 * proyectos donde es miembro. Reemplazar por un fetch real cuando exista el backend.
 */
export async function getProyectos(): Promise<MisProyectosResponse> {
  return Promise.resolve({
    usuario: { ...RESPUESTA_MOCK.usuario },
    proyectos: [...RESPUESTA_MOCK.proyectos],
  });
}

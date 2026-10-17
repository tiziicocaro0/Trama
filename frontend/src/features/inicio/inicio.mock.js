// Ejemplos de presentación: no provienen de la API ni pertenecen al usuario.
// Reemplazar por un servicio de src/api/ cuando exista el contrato correspondiente.
export const acompanamientosEjemplo = [
  { id: 'familia', titulo: 'Familia', tono: 'familia' },
  { id: 'escuela', titulo: 'Escuela', tono: 'escuela' },
  { id: 'profesionales', titulo: 'Profesionales', tono: 'profesionales' },
]

export const eventosEjemplo = [
  {
    id: 'docente',
    dia: 'LUN',
    fecha: '20',
    titulo: 'Reunión con la docente',
    horario: '10:00 – 11:00',
    tono: 'escuela',
  },
  {
    id: 'sesion',
    dia: 'MAR',
    fecha: '21',
    titulo: 'Sesión con la psicóloga',
    horario: '15:00 – 16:00',
    tono: 'familia',
  },
  {
    id: 'reunion',
    dia: 'JUE',
    fecha: '23',
    titulo: 'Reunión familiar',
    horario: '18:00 – 19:00',
    tono: 'profesionales',
  },
]

// Catálogo visual de módulos futuros, sin recursos ni contenido publicado.
export const recursosFuturos = [
  {
    id: 'guias',
    titulo: 'Guías y materiales',
    descripcion: 'Recursos para el día a día',
  },
  {
    id: 'estrategias',
    titulo: 'Estrategias',
    descripcion: 'Herramientas prácticas',
  },
  {
    id: 'comunidad',
    titulo: 'Comunidad',
    descripcion: 'Experiencias y consejos',
  },
]

export const seccionesFuturas = {
  acompanamientos: 'Acompañamientos',
  familia: 'Familia',
  escuela: 'Escuela',
  profesionales: 'Profesionales',
  recursos: 'Recursos',
  calendario: 'Calendario',
  perfil: 'Mi perfil',
  guias: 'Guías y materiales',
  estrategias: 'Estrategias',
  comunidad: 'Comunidad',
}

// Ejemplos ficticios de presentación, sin vínculo con un niño ni con su proyecto.
const ejemplosPorTipo = {
  FORTALEZA: [
    'Creatividad',
    'Buena memoria',
    'Perseverancia',
    'Disfruta resolver desafíos',
  ],
  INTERES: ['Música', 'Fútbol', 'Dibujo'],
  COMUNICACION: ['Prefiere instrucciones claras', 'Responde a apoyos visuales'],
  SENSORIAL: [],
  ESTRATEGIA: ['Anticipar cambios', 'Dar tiempo para responder'],
  RUTINA: ['Rutina de mañana', 'Rutina escolar'],
}

export function obtenerAportesEjemplo(tipo) {
  return (ejemplosPorTipo[tipo] ?? [])
    .map((titulo, indice) => ({
      id: `ejemplo-${tipo}-${indice}`,
      titulo,
      creadoEn: `2026-10-${String(17 - indice).padStart(2, '0')}T12:00:00Z`,
    }))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

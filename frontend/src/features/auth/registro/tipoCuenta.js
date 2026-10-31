// 9.4: cómo va a usar TRAMA la persona. Los valores coinciden con el enum TipoCuenta del backend.
// No da permisos: el rol en cada niño lo elige quien invita.
export const TIPOS_CUENTA = [
  {
    valor: 'FAMILIA',
    titulo: 'Soy familia',
    descripcion: 'Madre, padre, tutor o familiar de un niño.',
  },
  {
    valor: 'PROFESIONAL',
    titulo: 'Soy profesional',
    descripcion: 'Docente, terapeuta o profesional de la salud.',
  },
]

export function nombreTipoCuenta(valor) {
  return TIPOS_CUENTA.find((tipo) => tipo.valor === valor)?.titulo ?? ''
}

// 9.4: el profesional elige primero su área; cada una tiene sus especialidades (1.9).
export const AREAS_PROFESIONALES = [
  {
    valor: 'EDUCACION',
    titulo: 'Educación',
    descripcion: 'Docentes, maestras integradoras, equipos de orientación…',
  },
  {
    valor: 'SALUD',
    titulo: 'Salud',
    descripcion: 'Psicología, fonoaudiología, terapia ocupacional…',
  },
]

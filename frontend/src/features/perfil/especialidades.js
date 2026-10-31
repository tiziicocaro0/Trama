// 1.9: especialidades que puede declarar un profesional, según su rol.
// Los valores coinciden con el enum Especialidad del backend.
export const ESPECIALIDADES_EDUCACION = [
  { valor: 'DOCENTE_PRIMARIO', etiqueta: 'Docente primario' },
  { valor: 'DOCENTE_SECUNDARIO', etiqueta: 'Docente secundario' },
  { valor: 'DOCENTE_EDUCACION_ESPECIAL', etiqueta: 'Docente de educación especial' },
  { valor: 'MAESTRO_NIVEL_INICIAL', etiqueta: 'Maestro/a de nivel inicial' },
  { valor: 'MAESTRA_INTEGRADORA', etiqueta: 'Maestra integradora' },
  { valor: 'EQUIPO_ORIENTACION', etiqueta: 'Equipo de orientación' },
  { valor: 'PRECEPTOR_ESCOLAR', etiqueta: 'Preceptor/a escolar' },
  { valor: 'DIRECTOR_ESCUELA', etiqueta: 'Director/a de escuela' },
  { valor: 'ASISTENTE_EDUCACIONAL', etiqueta: 'Asistente educacional' },
  { valor: 'INSPECTOR', etiqueta: 'Inspector/a' },
  { valor: 'OTRA_EDUCACION', etiqueta: 'Otra (educación)' },
]

export const ESPECIALIDADES_SALUD = [
  { valor: 'PSICOLOGIA', etiqueta: 'Psicología' },
  { valor: 'PSICOPEDAGOGIA', etiqueta: 'Psicopedagogía' },
  { valor: 'FONOAUDIOLOGIA', etiqueta: 'Fonoaudiología' },
  { valor: 'LOGOPEDA', etiqueta: 'Logopeda' },
  { valor: 'TERAPIA_OCUPACIONAL', etiqueta: 'Terapia ocupacional' },
  { valor: 'ACOMPANANTE_TERAPEUTICO', etiqueta: 'Acompañante terapéutico' },
  { valor: 'PSIQUIATRIA', etiqueta: 'Psiquiatría' },
  { valor: 'PSIQUIATRIA_INFANTO_JUVENIL', etiqueta: 'Psiquiatría infanto-juvenil' },
  { valor: 'PEDIATRIA', etiqueta: 'Pediatría' },
  { valor: 'GENETISTA', etiqueta: 'Genetista' },
  { valor: 'PSICOLOGO_SOCIAL', etiqueta: 'Psicólogo/a social' },
  { valor: 'TRABAJADOR_SOCIAL', etiqueta: 'Trabajador/a social' },
  { valor: 'OTRA_SALUD', etiqueta: 'Otra (salud)' },
]

const ETIQUETAS_ESPECIALIDAD = Object.fromEntries(
  [...ESPECIALIDADES_EDUCACION, ...ESPECIALIDADES_SALUD].map(
    ({ valor, etiqueta }) => [valor, etiqueta],
  ),
)

export function etiquetaEspecialidad(valor) {
  return ETIQUETAS_ESPECIALIDAD[valor] ?? valor
}

// 9.4: valores de un área, para precargar las especialidades de la cuenta al aceptar una invitación.
export function especialidadesDelRol(rol) {
  const lista = rol === 'EDUCACION' ? ESPECIALIDADES_EDUCACION : ESPECIALIDADES_SALUD
  return lista.map(({ valor }) => valor)
}

export function esOtraEspecialidad(valor) {
  return valor === 'OTRA_EDUCACION' || valor === 'OTRA_SALUD'
}

// Para mostrar: en «Otra» va lo que escribió la persona.
export function nombreEspecialidad({ especialidad, aclaracion }) {
  return esOtraEspecialidad(especialidad) && aclaracion?.trim()
    ? aclaracion.trim()
    : etiquetaEspecialidad(especialidad)
}

import { TIPOS_NOTA } from './perfil.js'
import { hoyIso } from '../../utils/fechas.js'
import { Ear, Eye, Footprints, ForkKnife, Hand, Image, ListNumbers, PauseCircle, PersonSimple, PersonSimpleRun, SlidersHorizontal, Sparkle, SquaresFour } from '@phosphor-icons/react'

export const CATEGORIAS_COMUNICACION = [
  ['EXPRESION', 'Expresión'],
  ['COMPRENSION', 'Comprensión'],
  ['NO_VERBAL', 'Comunicación no verbal'],
  ['INTERACCION_SOCIAL', 'Interacción social'],
  ['TIEMPO_ESPERA', 'Tiempo de espera'],
  ['APOYOS', 'Apoyos comunicativos'],
]

export const FORMAS_COMUNICACION = [
  ['VERBAL', 'Verbal'],
  ['PICTOGRAMAS', 'Pictogramas'],
  ['GESTOS', 'Gestos'],
  ['SENAS', 'Señas'],
  ['OTRA', 'Otra'],
]

export const CATEGORIAS_SENSORIALES = [
  ['VISION', 'Visión'],
  ['AUDICION', 'Audición'],
  ['TACTO', 'Tacto'],
  ['GUSTO_OLFATO', 'Gusto y olfato'],
  ['CONCIENCIA_CORPORAL', 'Conciencia corporal'],
  ['MOVIMIENTO_EQUILIBRIO', 'Movimiento y equilibrio'],
]

export const ICONOS_SENSORIALES = { VISION: Eye, AUDICION: Ear, TACTO: Hand, GUSTO_OLFATO: ForkKnife, CONCIENCIA_CORPORAL: PersonSimple, MOVIMIENTO_EQUILIBRIO: PersonSimpleRun }
export const TONOS_SENSORIALES = { VISION: 'bg-agua/20 text-agua', AUDICION: 'bg-secundario/15 text-secundario', TACTO: 'bg-miel/20 text-miel', GUSTO_OLFATO: 'bg-agua/15 text-secundario', CONCIENCIA_CORPORAL: 'bg-primario/15 text-primario', MOVIMIENTO_EQUILIBRIO: 'bg-miel/15 text-secundario' }

export function validarCamposSensoriales(extra, titulo) {
  return {
    ...(!['AYUDA', 'CUESTA'].includes(extra.lista) ? { lista: 'Elegí una lista.' } : {}),
    ...(!CATEGORIAS_SENSORIALES.some(([valor]) => valor === extra.categoria) ? { categoria: 'Elegí una categoría sensorial.' } : {}),
    ...(!titulo.trim() ? { titulo: 'Escribí un título breve.' } : {}),
  }
}

export const CONTEXTOS_SENSORIALES = [
  ['CASA', 'Casa'],
  ['ESCUELA', 'Escuela'],
  ['CONSULTORIO', 'Consultorio'],
  ['OTRO', 'Otro'],
]

export const CATEGORIAS_ESTRATEGIA = [
  ['ANTICIPACION_SECUENCIACION', 'Anticipación y secuenciación'],
  ['APOYOS_VISUALES_COMUNICATIVOS', 'Apoyos visuales y comunicativos'],
  ['ORGANIZACION_ENTORNO', 'Organización del entorno'],
  ['ADAPTACION_ACTIVIDADES', 'Adaptación de actividades'],
  ['REGULACION_PAUSAS', 'Regulación y pausas'],
  ['PARTICIPACION_AUTONOMIA', 'Participación y autonomía'],
  ['MOTIVACION_INTERESES', 'Motivación e intereses'],
]
export const ICONOS_ESTRATEGIA = { ANTICIPACION_SECUENCIACION: ListNumbers, APOYOS_VISUALES_COMUNICATIVOS: Image, ORGANIZACION_ENTORNO: SquaresFour, ADAPTACION_ACTIVIDADES: SlidersHorizontal, REGULACION_PAUSAS: PauseCircle, PARTICIPACION_AUTONOMIA: Footprints, MOTIVACION_INTERESES: Sparkle }
export const TONOS_ESTRATEGIA = { ANTICIPACION_SECUENCIACION: 'bg-miel/20 text-secundario', APOYOS_VISUALES_COMUNICATIVOS: 'bg-agua/20 text-secundario', ORGANIZACION_ENTORNO: 'bg-miel/15 text-secundario', ADAPTACION_ACTIVIDADES: 'bg-agua/15 text-secundario', REGULACION_PAUSAS: 'bg-secundario/15 text-secundario', PARTICIPACION_AUTONOMIA: 'bg-primario/15 text-primario', MOTIVACION_INTERESES: 'bg-miel/15 text-primario' }
export const RESULTADOS_ESTRATEGIA = [
  ['FUNCIONO', 'Funcionó'],
  ['FUNCIONO_EN_PARTE', 'Funcionó en parte'],
  ['NO_FUNCIONO', 'No funcionó'],
]
export const CONTEXTOS_ESTRATEGIA = [
  ['CASA', 'Casa'], ['ESCUELA', 'Escuela'], ['CONSULTORIO', 'Consultorio'],
  ['ACTIVIDAD_EXTRACURRICULAR', 'Actividad extracurricular'],
  ['DISTINTOS_CONTEXTOS', 'En distintos contextos'], ['OTRO', 'Otro'],
]

export function validarCamposEstrategia(extra, contenido) {
  return {
    ...(!CATEGORIAS_ESTRATEGIA.some(([valor]) => valor === extra.categoria) ? { categoria: 'Elegí una categoría.' } : {}),
    ...(!contenido.trim() ? { contenido: 'Contá qué se hizo.' } : {}),
    ...(!extra.situacion?.trim() ? { situacion: 'Describí en qué situación se aplicó.' } : {}),
    ...(!RESULTADOS_ESTRATEGIA.some(([valor]) => valor === extra.resultado) ? { resultado: 'Elegí el resultado.' } : {}),
  }
}

// 2.1 y 2.2: campos propios que el back exige en "datos" para estos tipos.
// Arrancan en un valor neutro para no frenar la carga; se pueden cambiar.
export const camposPorTipo = {
  INTERES: [
    {
      nombre: 'categoria',
      etiqueta: 'Categoría',
      inicial: 'OTRO',
      opciones: [
        ['JUEGO', 'Juego'],
        ['PERSONAJE', 'Personaje'],
        ['TEMA', 'Tema'],
        ['ACTIVIDAD', 'Actividad'],
        ['OBJETO', 'Objeto'],
        ['OTRO', 'Otro'],
      ],
    },
    {
      nombre: 'intensidad',
      etiqueta: 'Intensidad',
      inicial: 'MEDIA',
      opciones: [
        ['BAJA', 'Baja'],
        ['MEDIA', 'Media'],
        ['ALTA', 'Alta'],
      ],
    },
  ],
  FORTALEZA: [
    {
      nombre: 'contexto',
      etiqueta: '¿Dónde lo hace?',
      inicial: 'OTRO',
      opciones: [
        ['CASA', 'Casa'],
        ['ESCUELA', 'Escuela'],
        ['CONSULTORIO', 'Consultorio'],
        ['OTRO', 'Otro'],
      ],
    },
    {
      nombre: 'ejemplo',
      etiqueta: 'Ejemplo (opcional)',
      tipo: 'texto',
      inicial: '',
      maximo: 500,
    },
  ],
  // 4.2: tipo de nota y fecha (hoy por defecto)
  NOTA_PROFESIONAL: [
    {
      nombre: 'tipoNota',
      etiqueta: 'Tipo de nota',
      inicial: 'ORIENTACION',
      opciones: TIPOS_NOTA,
    },
    { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', inicial: hoyIso },
  ],
}

// 2.2: textos propios del formulario según la sección; el resto usa los genéricos.
export const textosPorTipo = {
  ESTRATEGIA: { titulo: 'Título del aporte', contenido: 'Qué se hizo' },
  FORTALEZA: {
    titulo: '¿Qué hace bien o disfruta?',
  },
}

// Los campos de texto opcionales vacíos no se mandan (ej. el ejemplo de una fortaleza).
export function datosSinVacios(datos) {
  return Object.fromEntries(
    Object.entries(datos)
      .map(([clave, valor]) => [clave, typeof valor === 'string' ? valor.trim() : valor])
      .filter(([, valor]) => valor !== ''),
  )
}

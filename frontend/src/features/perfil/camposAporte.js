import { TIPOS_NOTA } from './perfil.js'
import { hoyIso } from '../../utils/fechas.js'
import { Ear, Eye, Footprints, ForkKnife, Hand, HandHeart, HandPalm, Image, ListNumbers, MoonStars, PauseCircle, PersonSimple, PersonSimpleRun, PersonSimpleWalk, Shower, SlidersHorizontal, Sparkle, SquaresFour, TShirt, Toilet, ChatCircle, HandPointing, Hourglass, UsersThree, WaveSine } from '@phosphor-icons/react'

export const textosPorTipo = {
  ESTRATEGIA: {
    titulo: 'Título del aporte',
    contenido: 'Qué se hizo',
    introduccion:
      'Compartí una estrategia que haya funcionado o que quieras registrar.',
    aclaracion:
      'Completá la información para que otras personas de la red puedan entender cuándo y cómo se aplicó.',
  },

  RUTINA: {
    titulo: 'Título del aporte',
    contenido: 'Descripción',
    introduccion:
      'Compartí una observación sobre cómo participa en una actividad cotidiana y qué suele ayudarle.',
    aclaracion:
      'Todos los campos son obligatorios, salvo el contexto y el archivo adjunto.',
  },

  DESREGULACION: {
    titulo: 'Título del aporte',
    contenido: 'Descripción',
    placeholderTitulo:
      'Ej. Se tapa los oídos cuando hay demasiado ruido',
    hintTitulo:
      'Resumí lo que observaste en una frase.',
    placeholderContenido:
      'Contá qué suele pasar, en qué situación lo observaste y qué respuesta viste.',
    hintContenido:
      'Usá palabras cotidianas: describí lo que viste y cómo respondió.',
    introduccion:
      'Compartí una señal, estrategia o pauta que pueda ayudar a acompañar mejor.',
    aclaracion:
      'Todos los campos son obligatorios, salvo el lugar, el archivo y la sugerencia para la guía.',
  },

  FORTALEZA: {
    titulo: '¿Qué hace bien o disfruta?',
  },
}

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

export const TONOS_COMUNICACION = {
  EXPRESION: 'bg-agua/20 text-agua border-agua/30',
  COMPRENSION: 'bg-secundario/10 text-secundario border-secundario/30',
  NO_VERBAL: 'bg-miel/20 text-miel border-miel/40',
  INTERACCION_SOCIAL: 'bg-decoracion text-secundario border-borde',
  TIEMPO_ESPERA: 'bg-primario/10 text-primario border-primario/20',
  APOYOS: 'bg-agua/15 text-agua border-agua/30',
}

export const ICONOS_COMUNICACION = {
  EXPRESION: ChatCircle,
  COMPRENSION: Ear,
  NO_VERBAL: HandPointing,
  INTERACCION_SOCIAL: UsersThree,
  TIEMPO_ESPERA: Hourglass,
  APOYOS: Image,
}

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
export const ICONOS_LISTA_SENSORIAL = {
  AYUDA: Sparkle,
  CUESTA: WaveSine,
}

export const TONOS_LISTA_SENSORIAL = {
  AYUDA: 'bg-agua/15 text-agua border-agua/30',
  CUESTA: 'bg-miel/15 text-miel border-miel/30',
}

export const CATEGORIAS_DESREGULACION = [
  ['SENALES', 'Señales'],
  ['AYUDA', 'Qué ayuda'],
  ['EVITAR', 'Qué evitar'],
]

export const ICONOS_DESREGULACION = {
  SENALES: Eye,
  AYUDA: HandHeart,
  EVITAR: HandPalm,
}

export const TONOS_DESREGULACION = {
  SENALES: 'bg-agua/20 text-agua',
  AYUDA: 'bg-secundario/15 text-secundario',
  EVITAR: 'bg-miel/20 text-miel',
}

export const HOVER_CRUZ_DESREGULACION = {
  SENALES: 'hover:bg-agua/30',
  AYUDA: 'hover:bg-secundario/20',
  EVITAR: 'hover:bg-miel/30',
}

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

export const CATEGORIAS_RUTINA = [
  ['ALIMENTACION', 'Alimentación'],
  ['HIGIENE_CUIDADO_PERSONAL', 'Higiene y cuidado personal'],
  ['VESTIDO', 'Vestido'],
  ['USO_BANO', 'Uso del baño'],
  ['SUENO_DESCANSO', 'Sueño y descanso'],
  ['MOVILIDAD_AUTONOMIA', 'Movilidad y autonomía'],
]
export const ICONOS_RUTINA = { ALIMENTACION: ForkKnife, HIGIENE_CUIDADO_PERSONAL: Shower, VESTIDO: TShirt, USO_BANO: Toilet, SUENO_DESCANSO: MoonStars, MOVILIDAD_AUTONOMIA: PersonSimpleWalk }
export const TONOS_RUTINA = { ALIMENTACION: 'bg-miel/20 text-secundario', HIGIENE_CUIDADO_PERSONAL: 'bg-agua/20 text-secundario', VESTIDO: 'bg-primario/15 text-primario', USO_BANO: 'bg-miel/15 text-secundario', SUENO_DESCANSO: 'bg-agua/15 text-secundario', MOVILIDAD_AUTONOMIA: 'bg-secundario/15 text-secundario' }
export const CONTEXTOS_RUTINA = [
  ['CASA', 'Casa'], ['ESCUELA', 'Escuela'], ['CONSULTORIO', 'Consultorio'],
  ['DISTINTOS_CONTEXTOS', 'En distintos contextos'], ['OTRO', 'Otro'],
]
export const CATEGORIA_RUTINA_PERSONALIZADA = 'PERSONALIZADA'

export function claveCategoriaRutina(datos) {
  return datos.categoria === CATEGORIA_RUTINA_PERSONALIZADA && datos.categoriaNombre?.trim()
    ? `PERSONALIZADA:${datos.categoriaNombre.trim().toLocaleLowerCase('es')}`
    : datos.categoria ?? ''
}

export function etiquetaCategoriaRutina(datos) {
  return datos.categoria === CATEGORIA_RUTINA_PERSONALIZADA
    ? datos.categoriaNombre?.trim() ?? ''
    : CATEGORIAS_RUTINA.find(([valor]) => valor === datos.categoria)?.[1] ?? ''
}

export function validarCamposRutina(extra, titulo, contenido, visibilidad) {
  return {
    ...(!(CATEGORIAS_RUTINA.some(([valor]) => valor === extra.categoria) || extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA) ? { categoria: 'Elegí una actividad o escribí una categoría.' } : {}),
    ...(extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA && !extra.categoriaNombre?.trim() ? { categoriaNombre: 'Escribí el nombre de la categoría.' } : {}),
    ...(extra.categoria === CATEGORIA_RUTINA_PERSONALIZADA && extra.categoriaNombre?.trim().length > 60 ? { categoriaNombre: 'Usá hasta 60 caracteres.' } : {}),
    ...(!titulo.trim() ? { titulo: 'Escribí un título para el aporte.' } : {}),
    ...(!contenido.trim() ? { contenido: 'Contá brevemente cómo realiza la actividad.' } : {}),
    ...(!['TODOS', 'PROFESIONALES', 'SOLO_TUTORES'].includes(visibilidad) ? { visibilidad: 'Elegí quién puede ver este aporte.' } : {}),
  }
}

export function validarCamposEstrategia(extra, contenido) {
  return {
    ...(!CATEGORIAS_ESTRATEGIA.some(([valor]) => valor === extra.categoria) ? { categoria: 'Elegí una categoría.' } : {}),
    ...(!contenido.trim() ? { contenido: 'Contá qué se hizo.' } : {}),
    ...(!extra.situacion?.trim() ? { situacion: 'Describí en qué situación se aplicó.' } : {}),
    ...(!RESULTADOS_ESTRATEGIA.some(([valor]) => valor === extra.resultado) ? { resultado: 'Elegí el resultado.' } : {}),
  }
}

export const CAMPOS_DESREGULACION = [
  ['SENALES', 'Señales'],
  ['AYUDA', 'Qué ayuda'],
  ['EVITAR', 'Qué evitar'],
]

export function validarCamposDesregulacion(extra, titulo, contenido, visibilidad) {
  return {
    ...(!CAMPOS_DESREGULACION.some(([valor]) => valor === extra.lista)
      ? { lista: 'Elegí una lista.' }
      : {}),

    ...(!titulo.trim()
      ? { titulo: 'Escribí un título para el aporte.' }
      : {}),

    ...(!contenido.trim()
      ? { contenido: 'Contá brevemente qué observaste o qué ayuda.' }
      : {}),

    ...(!['TODOS', 'PROFESIONALES', 'SOLO_TUTORES'].includes(visibilidad)
      ? { visibilidad: 'Elegí quién puede ver este aporte.' }
      : {}),
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

// Los campos de texto opcionales vacíos no se mandan (ej. el ejemplo de una fortaleza).
export function datosSinVacios(datos) {
  return Object.fromEntries(
    Object.entries(datos)
      .map(([clave, valor]) => [clave, typeof valor === 'string' ? valor.trim() : valor])
      .filter(([, valor]) => valor !== ''),
  )
}

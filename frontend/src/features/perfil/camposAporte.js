import { TIPOS_NOTA } from './perfil.js'
import { hoyIso } from '../../utils/fechas.js'

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

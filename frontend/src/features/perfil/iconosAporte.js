import {
  CalendarBlank,
  ChatCircle,
  Ear,
  Eye,
  FolderSimple,
  Heart,
  Lightbulb,
  ListBullets,
  NotePencil,
  Palette,
  Sparkle,
  Star,
} from '@phosphor-icons/react'

// Ícono y nombre de cada tipo de aporte (iguales al enum TipoAporte del back).
// Los usan el perfil y la galería de Recursos para mostrar dónde se cargó algo.
export const ICONOS_APORTE = {
  FORTALEZA: Star,
  INTERES: Palette,
  COMUNICACION: ChatCircle,
  SENSORIAL: Ear,
  ESTRATEGIA: Lightbulb,
  RUTINA: CalendarBlank,
  NOTA_PROFESIONAL: NotePencil,
  DESREGULACION: Heart,
  OBSERVACION: Eye,
  ABC: ListBullets,
  SUGERENCIA: Sparkle,
}

export const ETIQUETAS_APORTE = {
  FORTALEZA: 'Fortalezas',
  INTERES: 'Intereses',
  COMUNICACION: 'Comunicación',
  SENSORIAL: 'Perfil sensorial',
  ESTRATEGIA: 'Estrategias',
  RUTINA: 'Rutinas',
  NOTA_PROFESIONAL: 'Notas',
  DESREGULACION: 'Si se desregula',
  OBSERVACION: 'Bitácora',
  ABC: 'Bitácora',
  SUGERENCIA: 'Sugerencias',
}

// Un archivo subido directo a Recursos (no es adjunto de un aporte)
export const ICONO_RECURSO = FolderSimple

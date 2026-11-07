import TarjetaAporte from '../../components/ui/TarjetaAporte.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

// Datos ficticios: la tarjeta solo llama a la API si se tocan sus botones
const APORTE = {
  id: 'vitrina-aporte',
  proyectoId: 'vitrina',
  tipo: 'FORTALEZA',
  titulo: 'Le gusta dibujar animales',
  contenido: 'Pasa largos ratos dibujando con mucho detalle. Lo ayuda a calmarse después del recreo.',
  datos: JSON.stringify({ contexto: 'ESCUELA' }),
  visibilidad: 'TODOS',
  autorNombre: 'María Pérez',
  creadoEn: '2026-11-02T14:30:00Z',
  puedeEditar: false,
  archivos: [],
  autorEspecialidades: [],
  confirmaciones: 2,
  yoConfirme: false,
  confirmadoPor: ['Jorge Gómez', 'Ana Ruiz'],
}

export function SeccionTarjetaAporte() {
  return (
    <Tarjeta titulo="Tarjeta de aporte">
      <TarjetaAporte aporte={APORTE} autor={APORTE.autorNombre} />
    </Tarjeta>
  )
}

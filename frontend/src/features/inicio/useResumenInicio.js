import { useEffect, useState } from 'react'
import { obtenerMisProyectos } from '../../api/proyectos.js'
import { listarEventos } from '../../api/eventos.js'
import { hoyIso } from '../../utils/fechas.js'
import { sumarDias } from '../calendario/utils/periodo.js'

export const DIAS_DE_EVENTOS = 30
const CANTIDAD_DE_EVENTOS = 3

// Inicio: los niños que acompaña la persona y sus próximos eventos, con datos reales.
export default function useResumenInicio(activo = true) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!activo) return undefined
    const controller = new AbortController()
    const desde = hoyIso()
    const hasta = sumarDias(desde, DIAS_DE_EVENTOS)

    async function cargar() {
      try {
        const proyectos = await obtenerMisProyectos(controller.signal)
        // Si falla el calendario de un niño, se muestran los de los demás.
        const listas = await Promise.all(
          proyectos.map((proyecto) =>
            listarEventos(proyecto.id, { desde, hasta, signal: controller.signal }).then(
              (eventos) =>
                eventos.map((evento) => ({
                  ...evento,
                  proyectoId: proyecto.id,
                  proyectoNombre: proyecto.apodo || proyecto.nombre,
                })),
              () => [],
            ),
          ),
        )
        const eventos = listas
          .flat()
          .filter((evento) => typeof evento?.fecha === 'string' && evento.fecha >= desde)
          .sort((a, b) =>
            `${a.fecha} ${a.horaInicio ?? ''}`.localeCompare(`${b.fecha} ${b.horaInicio ?? ''}`),
          )
          .slice(0, CANTIDAD_DE_EVENTOS)
        if (!controller.signal.aborted) setResultado({ intento, proyectos, eventos })
      } catch {
        if (!controller.signal.aborted) setResultado({ intento, error: true })
      }
    }

    cargar()
    return () => controller.abort()
  }, [intento, activo])

  return {
    cargando: resultado?.intento !== intento,
    error: Boolean(resultado?.error),
    proyectos: resultado?.proyectos ?? [],
    eventos: resultado?.eventos ?? [],
    reintentar: () => setIntento((actual) => actual + 1),
  }
}

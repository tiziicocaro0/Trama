import { useState } from 'react'
import { guardarPermisosFamiliar } from '../../../api/proyectos.js'
import Interruptor from '../../../components/ui/Interruptor.jsx'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'

// 1.8: el tutor administrador decide qué pueden hacer los familiares (abuelos, tíos…) en este niño.
// Cada cambio se guarda al instante; si falla, el interruptor vuelve a como estaba.
export default function PermisosFamiliares({ proyecto }) {
  const [permisos, setPermisos] = useState({
    familiarPuedeCargar: Boolean(proyecto.familiarPuedeCargar),
    familiarVeNotas: Boolean(proyecto.familiarVeNotas),
  })
  const [guardando, setGuardando] = useState(null)

  async function cambiar(campo, valor) {
    if (guardando) return
    const anteriores = permisos
    const nuevos = { ...permisos, [campo]: valor }
    setPermisos(nuevos)
    setGuardando(campo)
    try {
      const actualizado = await guardarPermisosFamiliar(proyecto.id, nuevos)
      setPermisos({
        familiarPuedeCargar: Boolean(actualizado?.familiarPuedeCargar ?? nuevos.familiarPuedeCargar),
        familiarVeNotas: Boolean(actualizado?.familiarVeNotas ?? nuevos.familiarVeNotas),
      })
      avisar('Guardamos el cambio.')
    } catch (error) {
      setPermisos(anteriores)
      avisarError(error?.response?.data?.mensaje || 'No pudimos guardar el cambio. Intentá nuevamente.')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section aria-labelledby="titulo-permisos-familiares" className="mt-10 rounded-lg bg-superficie p-6 shadow-sm">
      <h2 id="titulo-permisos-familiares" className="font-display text-h2 text-secundario">
        Qué pueden hacer los familiares
      </h2>
      <p className="mt-2 text-texto-suave">
        Aplica a quienes están en la red como familiar. Los tutores siempre pueden todo.
      </p>
      <ul className="mt-4 divide-y divide-borde/60">
        <li className="py-3">
          <Interruptor
            id="familiar-puede-cargar"
            etiqueta="Cargar aportes"
            descripcion="Pueden sumar fortalezas, intereses, observaciones y el resto de las secciones."
            checked={permisos.familiarPuedeCargar}
            disabled={guardando === 'familiarPuedeCargar'}
            onChange={(evento) => cambiar('familiarPuedeCargar', evento.target.checked)}
          />
        </li>
        <li className="py-3">
          <Interruptor
            id="familiar-ve-notas"
            etiqueta="Ver las notas profesionales"
            descripcion="Pueden leer las notas que los profesionales dejaron visibles para todos."
            checked={permisos.familiarVeNotas}
            disabled={guardando === 'familiarVeNotas'}
            onChange={(evento) => cambiar('familiarVeNotas', evento.target.checked)}
          />
        </li>
      </ul>
    </section>
  )
}

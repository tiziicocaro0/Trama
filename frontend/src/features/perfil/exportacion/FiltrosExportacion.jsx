import { useEffect, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import { listarMiembros } from '../../../api/miembros.js'

// Los mismos tres grupos que colorean la línea de tiempo del PDF
const TIPOS = [
  { tipo: 'FAMILIA', etiqueta: 'Familia', roles: ['TUTOR', 'FAMILIAR'] },
  { tipo: 'DOCENTE', etiqueta: 'Docentes', roles: ['EDUCACION'] },
  { tipo: 'PROFESIONAL', etiqueta: 'Profesionales', roles: ['SALUD'] },
]

const PASTILLA =
  'rounded-full border border-borde bg-superficie px-3 py-2 has-checked:border-primario has-checked:bg-fondo'

// 8.1: antes de bajar el PDF se puede elegir qué aportes van (fechas y aportadores).
// Sin marcar "Elegir", se exporta todo. El perfil, los miembros, los eventos y los acuerdos van siempre.
export default function FiltrosExportacion({ abierto, proyectoId, descargando, onCerrar, onDescargar }) {
  const [elegir, setElegir] = useState(false)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [miembros, setMiembros] = useState([])
  const [elegidos, setElegidos] = useState(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!abierto) return undefined
    const control = new AbortController()
    listarMiembros(proyectoId, control.signal)
      .then((lista) => {
        setMiembros(lista)
        setElegidos(new Set(lista.map((m) => m.usuarioId)))
      })
      .catch((problema) => {
        if (problema?.name !== 'CanceledError') setError('No pudimos cargar la red. Podés exportar todo.')
      })
    return () => control.abort()
  }, [abierto, proyectoId])

  const grupos = TIPOS.map((grupo) => ({
    ...grupo,
    personas: miembros.filter((m) => grupo.roles.includes(m.rol)),
  })).filter((grupo) => grupo.personas.length > 0)

  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const nadie = elegir && miembros.length > 0 && elegidos.size === 0

  function alternarPersona(usuarioId) {
    setElegidos((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(usuarioId)) nuevo.delete(usuarioId)
      else nuevo.add(usuarioId)
      return nuevo
    })
  }

  function alternarGrupo(grupo, marcado) {
    setElegidos((actual) => {
      const nuevo = new Set(actual)
      grupo.personas.forEach((p) => (marcado ? nuevo.add(p.usuarioId) : nuevo.delete(p.usuarioId)))
      return nuevo
    })
  }

  function descargar() {
    if (!elegir) return onDescargar({})
    const filtros = {}
    if (desde) filtros.desde = desde
    if (hasta) filtros.hasta = hasta
    // Si están todos, no hace falta filtrar por persona
    if (elegidos.size < miembros.length) filtros.usuarios = [...elegidos]
    return onDescargar(filtros)
  }

  return (
    <Modal abierto={abierto} titulo="Descargar los datos en PDF" onCerrar={onCerrar} cerrarAlTocarFuera>
      <div className="space-y-4 text-texto">
        <CasillaOvillo checked={elegir} onChange={(e) => setElegir(e.target.checked)}>
          Elegir qué aportes incluir
        </CasillaOvillo>
        {!elegir && <p className="text-sm text-texto-suave">Sin marcarla, se exportan todos los aportes.</p>}

        {elegir && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* CampoFormulario deja la etiqueta solo para lectores de pantalla: acá hace falta verla */}
              <div>
              <p aria-hidden="true" className="mb-1 text-sm font-semibold text-secundario">Desde <span className="font-normal text-texto-suave">(opcional)</span></p>
              <CampoFormulario id="exportar-desde" label="Desde (opcional)">
                <CampoFecha id="exportar-desde" name="desde" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </CampoFormulario>
              </div>
              <div>
              <p aria-hidden="true" className="mb-1 text-sm font-semibold text-secundario">Hasta <span className="font-normal text-texto-suave">(opcional)</span></p>
              <CampoFormulario
                id="exportar-hasta"
                label="Hasta (opcional)"
                error={rangoInvalido ? 'Tiene que ser posterior a "Desde"' : undefined}
              >
                <CampoFecha id="exportar-hasta" name="hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </CampoFormulario>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="font-semibold text-secundario">Quiénes aportaron</legend>
              {grupos.map((grupo) => (
                <div key={grupo.tipo}>
                  <CasillaOvillo
                    checked={grupo.personas.every((p) => elegidos.has(p.usuarioId))}
                    onChange={(e) => alternarGrupo(grupo, e.target.checked)}
                  >
                    <span className="font-semibold">{grupo.etiqueta}</span>
                  </CasillaOvillo>
                  <div className="mt-1 ml-12 flex flex-wrap gap-2">
                    {grupo.personas.map((p) => (
                      <CasillaOvillo
                        key={p.usuarioId}
                        tamano="chico"
                        className={PASTILLA}
                        checked={elegidos.has(p.usuarioId)}
                        onChange={() => alternarPersona(p.usuarioId)}
                      >
                        {p.nombre} {p.apellido}
                      </CasillaOvillo>
                    ))}
                  </div>
                </div>
              ))}
              {nadie && <p role="alert" className="text-sm text-error">Elegí al menos una persona.</p>}
            </fieldset>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <p className="text-sm text-texto-suave">
          El perfil, los miembros, los eventos y los acuerdos van siempre completos.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton variant="secondary" onClick={onCerrar}>Cancelar</Boton>
          <Boton onClick={descargar} disabled={Boolean(descargando) || (elegir && (rangoInvalido || nadie))}>
            <DownloadSimple size={18} aria-hidden="true" />
            {descargando ? 'Preparando…' : 'Descargar PDF'}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

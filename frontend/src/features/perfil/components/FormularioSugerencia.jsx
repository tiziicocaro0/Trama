import { useRef, useState } from 'react'
import { guardarAporte } from '../../../api/aportes.js'
import Boton from '../../../components/ui/Boton.jsx'
import { leerDatosAporte } from '../perfil.js'

const CLASE_CAMPO = 'w-full rounded-md border bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario'

// 7.2: un profesional sugiere una actividad para hacer en casa, vinculada a un interés del niño
export default function FormularioSugerencia({ proyectoId, intereses, sugerencia, alGuardar, alCancelar }) {
  const guardados = leerDatosAporte(sugerencia?.datos)
  const [titulo, setTitulo] = useState(sugerencia?.titulo ?? '')
  const [contenido, setContenido] = useState(sugerencia?.contenido ?? '')
  const [interesId, setInteresId] = useState(guardados.interesId ?? '')
  const [materiales, setMateriales] = useState(guardados.materiales ?? '')
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const alerta = useRef(null)

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    const faltan = {
      ...(!titulo.trim() ? { titulo: 'Escribí la actividad.' } : {}),
      ...(!contenido.trim() ? { contenido: 'Contá cómo hacerla en casa.' } : {}),
      ...(!interesId ? { interesId: 'Elegí con qué interés se relaciona.' } : {}),
    }
    setErrores(faltan)
    if (Object.keys(faltan).length) return
    setEnviando(true)
    setError('')
    try {
      await guardarAporte(proyectoId, sugerencia?.id, {
        tipo: 'SUGERENCIA',
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        visibilidad: 'TODOS',
        datos: JSON.stringify({ interesId, ...(materiales.trim() ? { materiales: materiales.trim() } : {}) }),
      })
      alGuardar()
    } catch (errorGuardado) {
      setError(errorGuardado.message)
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form aria-labelledby="titulo-formulario-sugerencia" onSubmit={enviar} noValidate className="space-y-4 rounded-lg bg-superficie p-5 shadow-sm sm:p-6">
      <h2 id="titulo-formulario-sugerencia" className="font-display text-h2 text-secundario">
        {sugerencia ? 'Editar sugerencia' : 'Nueva sugerencia para casa'}
      </h2>
      <div>
        <label htmlFor="sugerencia-titulo" className="mb-2 block font-semibold">Actividad</label>
        <input id="sugerencia-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} disabled={enviando} aria-invalid={Boolean(errores.titulo)} placeholder="Ej. Contar los dinosaurios en la merienda" className={`min-h-14 ${CLASE_CAMPO} ${errores.titulo ? 'border-error' : 'border-borde'}`} />
        {errores.titulo && <p role="alert" className="mt-1 text-sm text-error">{errores.titulo}</p>}
      </div>
      <div>
        <label htmlFor="sugerencia-interes" className="mb-2 block font-semibold">¿Con qué interés se relaciona?</label>
        <select id="sugerencia-interes" value={interesId} onChange={(e) => setInteresId(e.target.value)} disabled={enviando} aria-invalid={Boolean(errores.interesId)} className={`min-h-14 ${CLASE_CAMPO} ${errores.interesId ? 'border-error' : 'border-borde'}`}>
          <option value="">Elegí un interés</option>
          {intereses.map((interes) => <option key={interes.id} value={interes.id}>{interes.titulo}</option>)}
        </select>
        {errores.interesId && <p role="alert" className="mt-1 text-sm text-error">{errores.interesId}</p>}
        {!intereses.length && <p className="mt-1 text-sm text-texto-suave">Todavía no hay intereses cargados en el perfil. Sumá uno primero en Intereses.</p>}
      </div>
      <div>
        <label htmlFor="sugerencia-contenido" className="mb-2 block font-semibold">¿Cómo hacerla en casa?</label>
        <textarea id="sugerencia-contenido" value={contenido} onChange={(e) => setContenido(e.target.value)} rows={4} maxLength={2000} disabled={enviando} aria-invalid={Boolean(errores.contenido)} placeholder="Ej. Mientras merienda, pedirle que ordene los muñecos del más chico al más grande y los cuente en voz alta." className={`${CLASE_CAMPO} ${errores.contenido ? 'border-error' : 'border-borde'}`} />
        {errores.contenido && <p role="alert" className="mt-1 text-sm text-error">{errores.contenido}</p>}
      </div>
      <div>
        <label htmlFor="sugerencia-materiales" className="mb-2 block font-semibold">Materiales <span className="font-normal text-texto-suave">Opcional</span></label>
        <input id="sugerencia-materiales" value={materiales} onChange={(e) => setMateriales(e.target.value)} maxLength={500} disabled={enviando} placeholder="Ej. Muñecos de dinosaurios, una caja" className={`min-h-14 ${CLASE_CAMPO} border-borde`} />
      </div>
      {error && <p ref={alerta} tabIndex={-1} role="alert" className="text-error">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Boton type="submit" tamano="chico" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar sugerencia'}</Boton>
        <Boton variant="secondary" tamano="chico" onClick={alCancelar} disabled={enviando}>Cancelar</Boton>
      </div>
    </form>
  )
}

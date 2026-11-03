import { useEffect, useRef, useState } from 'react'
import Campo from '../../../components/ui/Campo.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import { guardarAporte } from '../../../api/aportes.js'
import { leerDatosAporte } from '../perfil.js'
import { CATEGORIAS_COMUNICACION, FORMAS_COMUNICACION, camposPorTipo, datosSinVacios, textosPorTipo, validarCamposSensoriales, validarCamposEstrategia } from '../camposAporte.js'
import CamposSensoriales from './CamposSensoriales.jsx'
import CamposEstrategia from './CamposEstrategia.jsx'
import AdjuntosAporte from './AdjuntosAporte.jsx'
import PieEditorAporte from './PieEditorAporte.jsx'
import { hoyIso } from '../../../utils/fechas.js'

const SECCIONES_CON_ADJUNTOS = ['NOTA_PROFESIONAL', 'COMUNICACION', 'SENSORIAL', 'ESTRATEGIA']

export default function EditorAporte({
  seccion,
  proyectoId,
  aporte,
  alGuardar,
  alCancelar,
}) {
  const [titulo, setTitulo] = useState(aporte?.titulo ?? '')
  const [contenido, setContenido] = useState(aporte?.contenido ?? '')
  const [visibilidad, setVisibilidad] = useState(aporte?.visibilidad ?? 'TODOS')
  const [archivos, setArchivos] = useState(() =>
    Array.isArray(aporte?.archivos) ? aporte.archivos : [],
  )
  const campos = camposPorTipo[seccion.tipo] ?? []
  const [extra, setExtra] = useState(() => {
    const guardados = leerDatosAporte(aporte?.datos)
    return {
      ...(seccion.tipo === 'COMUNICACION' ? { categoria: '', formasComunicacion: [], otraForma: '', comoHablarle: '', queEvitar: '' } : {}),
      ...(seccion.tipo === 'SENSORIAL' ? { lista: '', categoria: '', contexto: '' } : {}),
      ...(seccion.tipo === 'ESTRATEGIA' ? { categoria: '', situacion: '', resultado: '', contextos: [] } : {}),
      ...guardados,
      ...Object.fromEntries(
        campos.map(({ nombre, inicial }) => [
          nombre,
          guardados[nombre] ??
            (typeof inicial === 'function' ? inicial() : inicial),
        ]),
      ),
    }
  })
  const [error, setError] = useState('')
  const [erroresCampos, setErroresCampos] = useState({})
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const formulario = useRef(null)
  const alerta = useRef(null)
  const esNota = seccion.tipo === 'NOTA_PROFESIONAL'
  const esComunicacion = seccion.tipo === 'COMUNICACION'
  const esSensorial = seccion.tipo === 'SENSORIAL'
  const esEstrategia = seccion.tipo === 'ESTRATEGIA'
  const permiteAdjuntos = SECCIONES_CON_ADJUNTOS.includes(seccion.tipo)
  const sustantivo = esNota ? 'nota' : 'aporte'
  const textos = textosPorTipo[seccion.tipo] ?? {}
  const etiquetaTitulo = textos.titulo ?? 'Título'
  useEffect(() => {
    formulario.current?.querySelector('input')?.focus()
  }, [])

  async function guardar(event) {
    event.preventDefault()
    if (pendiente.current) return
    if (esComunicacion) {
      const errores = {
        ...(!extra.categoria ? { categoria: 'Elegí una categoría.' } : {}),
        ...(!Array.isArray(extra.formasComunicacion) || !extra.formasComunicacion.length
          ? { formasComunicacion: 'Elegí al menos una forma de comunicación.' } : {}),
        ...(extra.formasComunicacion?.includes('OTRA') && !extra.otraForma?.trim()
          ? { otraForma: 'Contanos cuál es la otra forma.' } : {}),
        ...(!extra.comoHablarle?.trim() ? { comoHablarle: 'Contanos cómo conviene hablarle.' } : {}),
        ...(!extra.queEvitar?.trim() ? { queEvitar: 'Contanos qué conviene evitar.' } : {}),
      }
      setErroresCampos(errores)
      if (Object.keys(errores).length) return
    }
    if (esSensorial) {
      const errores = validarCamposSensoriales(extra, titulo)
      setErroresCampos(errores)
      if (Object.keys(errores).length) return
    }
    if (esEstrategia) {
      const errores = validarCamposEstrategia(extra, contenido)
      setErroresCampos(errores)
      if (Object.keys(errores).length) return
    }
    if (
      !titulo.trim() ||
      titulo.trim().length > 150 ||
      contenido.length > 10000
    ) {
      setErroresCampos((actual) => ({ ...actual, titulo: !titulo.trim() || titulo.trim().length > 150 ? 'Escribí un título de hasta 150 caracteres.' : '' }))
      setError(contenido.length > 10000 ? 'La descripción no puede superar los 10000 caracteres.' : '')
      requestAnimationFrame(() => alerta.current?.focus())
      return
    }
    pendiente.current = true
    setEnviando(true)
    setError('')
    try {
      const teniaArchivos =
        (Array.isArray(aporte?.archivos) && aporte.archivos.length > 0) ||
        (Array.isArray(aporte?.archivoIds) && aporte.archivoIds.length > 0)
      const incluirArchivos =
        permiteAdjuntos && (archivos.length > 0 || teniaArchivos)

      await guardarAporte(proyectoId, aporte?.id, {
        tipo: seccion.tipo,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        visibilidad,
        ...(campos.length || esComunicacion || esSensorial || esEstrategia ? { datos: JSON.stringify(datosSinVacios(esComunicacion && !extra.formasComunicacion?.includes('OTRA') ? { ...extra, otraForma: '' } : extra)) } : {}),
        ...(incluirArchivos
          ? { archivoIds: archivos.map((item) => item.id) }
          : {}),
      })
      alGuardar()
    } catch (errorGuardado) {
      setError(errorGuardado.message)
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  return (
    <form
      ref={formulario}
      onSubmit={guardar}
      noValidate
      aria-label={`${aporte ? 'Editar' : 'Agregar'} ${sustantivo} en ${seccion.titulo}`}
      aria-busy={enviando}
      className="mt-4 space-y-4 rounded-md border border-borde bg-bienvenida-luz p-4"
    >
      <p className="font-semibold text-secundario">
        {aporte
          ? `Editar ${sustantivo}`
          : esNota
            ? 'Nueva nota'
            : 'Nuevo aporte'}
      </p>
      {esSensorial && <CamposSensoriales extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esEstrategia && <CamposEstrategia parte="categoria" extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      <CampoFormulario
        id={`titulo-aporte-${seccion.tipo}`}
        label={etiquetaTitulo}
        hint={esSensorial ? 'Resumí lo que observaste en una frase, hasta 150 caracteres' : esEstrategia ? 'Resumí la estrategia en una frase breve, hasta 150 caracteres' : 'Obligatorio, hasta 150 caracteres'}
      >
        <Campo
          name="titulo"
          placeholder={etiquetaTitulo}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          maxLength={150}
          disabled={enviando}
        />
      </CampoFormulario>
      {erroresCampos.titulo && <p role="alert" className="text-sm text-error">{erroresCampos.titulo}</p>}
      <div>
        <label
          htmlFor={`contenido-aporte-${seccion.tipo}`}
          className="mb-2 block font-semibold"
        >
          {esSensorial ? 'Descripción u observación (opcional)' : textos.contenido ??
            (esNota ? 'Texto de la nota (opcional)' : 'Descripción (opcional)')}
        </label>
        <textarea
          id={`contenido-aporte-${seccion.tipo}`}
          name="contenido"
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          maxLength={10000}
          rows={4}
          disabled={enviando}
          aria-invalid={Boolean(erroresCampos.contenido)}
          className="w-full rounded-md border border-borde bg-superficie p-4 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
      </div>
      {erroresCampos.contenido && <p role="alert" className="text-sm text-error">{erroresCampos.contenido}</p>}
      {esEstrategia && <CamposEstrategia extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esSensorial && <CamposSensoriales parte="contexto" extra={extra} setExtra={setExtra} disabled={enviando} />}
      {esComunicacion && (
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 font-semibold">¿Sobre qué aspecto querés aportar?</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_COMUNICACION.map(([valor, etiqueta]) => (
                <label key={valor} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-2 has-checked:border-primario has-checked:bg-fondo">
                  <input type="radio" name="categoriaComunicacion" value={valor} checked={extra.categoria === valor} onChange={() => setExtra((actual) => ({ ...actual, categoria: valor }))} disabled={enviando} />
                  {etiqueta}
                </label>
              ))}
            </div>
            {erroresCampos.categoria && <p role="alert" className="mt-1 text-sm text-error">{erroresCampos.categoria}</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">¿Cómo se comunica?</legend>
            <div className="flex flex-wrap gap-2">
              {FORMAS_COMUNICACION.map(([valor, etiqueta]) => (
                <label key={valor} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-borde bg-superficie px-3 py-2 has-checked:border-primario has-checked:bg-fondo">
                  <input type="checkbox" checked={extra.formasComunicacion?.includes(valor) ?? false} onChange={(event) => setExtra((actual) => ({ ...actual, formasComunicacion: event.target.checked ? [...(actual.formasComunicacion ?? []), valor] : (actual.formasComunicacion ?? []).filter((forma) => forma !== valor) }))} disabled={enviando} />
                  {etiqueta}
                </label>
              ))}
            </div>
            {erroresCampos.formasComunicacion && <p role="alert" className="mt-1 text-sm text-error">{erroresCampos.formasComunicacion}</p>}
          </fieldset>
          {extra.formasComunicacion?.includes('OTRA') && (
            <div>
              <label htmlFor="otra-forma-comunicacion" className="mb-2 block font-semibold">Otra forma de comunicación</label>
              <Campo id="otra-forma-comunicacion" value={extra.otraForma ?? ''} maxLength={150} onChange={(event) => setExtra((actual) => ({ ...actual, otraForma: event.target.value }))} disabled={enviando} aria-invalid={Boolean(erroresCampos.otraForma)} />
              {erroresCampos.otraForma && <p role="alert" className="mt-1 text-sm text-error">{erroresCampos.otraForma}</p>}
            </div>
          )}
          {[["comoHablarle", "¿Cómo conviene hablarle?"], ["queEvitar", "¿Qué evitar?"]].map(([nombre, etiqueta]) => (
            <div key={nombre}>
              <label htmlFor={nombre} className="mb-2 block font-semibold">{etiqueta}</label>
              <textarea id={nombre} value={extra[nombre] ?? ''} onChange={(event) => setExtra((actual) => ({ ...actual, [nombre]: event.target.value }))} maxLength={2000} rows={3} disabled={enviando} aria-invalid={Boolean(erroresCampos[nombre])} className="w-full rounded-md border border-borde bg-superficie p-4 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario" />
              {erroresCampos[nombre] && <p role="alert" className="mt-1 text-sm text-error">{erroresCampos[nombre]}</p>}
            </div>
          ))}
        </div>
      )}
      {campos.map(({ nombre, etiqueta, opciones, tipo, maximo }) => (
        <div key={nombre}>
          <label
            htmlFor={`${nombre}-aporte-${seccion.tipo}`}
            className="mb-2 block font-semibold"
          >
            {etiqueta}
          </label>
          {tipo === 'texto' ? (
            <Campo
              id={`${nombre}-aporte-${seccion.tipo}`}
              name={nombre}
              value={extra[nombre] ?? ''}
              maxLength={maximo}
              onChange={(event) =>
                setExtra((actual) => ({
                  ...actual,
                  [nombre]: event.target.value,
                }))
              }
              disabled={enviando}
            />
          ) : tipo === 'fecha' ? (
            <CampoFecha
              id={`${nombre}-aporte-${seccion.tipo}`}
              name={nombre}
              value={extra[nombre]}
              max={hoyIso()}
              onChange={(event) =>
                setExtra((actual) => ({
                  ...actual,
                  [nombre]: event.target.value,
                }))
              }
              disabled={enviando}
              required
            />
          ) : (
            <select
              id={`${nombre}-aporte-${seccion.tipo}`}
              name={nombre}
              value={extra[nombre]}
              onChange={(event) =>
                setExtra((actual) => ({
                  ...actual,
                  [nombre]: event.target.value,
                }))
              }
              disabled={enviando}
              className="min-h-14 w-full rounded-md border border-borde bg-superficie px-4 py-3 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              {opciones.map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      {permiteAdjuntos && (
        <AdjuntosAporte
          proyectoId={proyectoId}
          archivos={archivos}
          onChange={setArchivos}
          disabled={enviando}
          sensorial={esSensorial}
          estrategia={esEstrategia}
        />
      )}
      {error && (
        <p ref={alerta} tabIndex={-1} role="alert" className="text-error">
          {error}
        </p>
      )}
      <PieEditorAporte tipo={seccion.tipo} visibilidad={visibilidad} onVisibilidad={(event) => setVisibilidad(event.target.value)} disabled={enviando} sensorial={esSensorial || esEstrategia} sustantivo={sustantivo} alCancelar={alCancelar} />
    </form>
  )
}

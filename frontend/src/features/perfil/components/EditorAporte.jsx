import { useEffect, useRef, useState } from 'react'
import Campo from '../../../components/ui/Campo.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CampoDetalleOtro from './CampoDetalleOtro.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import { guardarAporte } from '../../../api/aportes.js'
import { leerDatosAporte } from '../perfil.js'
import { CATEGORIAS_COMUNICACION, FORMAS_COMUNICACION, CATEGORIAS_DESREGULACION, ICONOS_DESREGULACION,TONOS_DESREGULACION,camposPorTipo, datosSinVacios, DETALLES_OTRO, eligioOtro, sinDetalleSobrante, textosPorTipo, validarCamposSensoriales, validarCamposEstrategia, validarCamposRutina, validarCamposDesregulacion, } from '../camposAporte.js'
import CamposSensoriales from './CamposSensoriales.jsx'
import CamposEstrategia from './CamposEstrategia.jsx'
import CamposRutina from './CamposRutina.jsx'
import CamposDesregulacion from './CamposDesregulacion.jsx'
import AdjuntosAporte from './AdjuntosAporte.jsx'
import PieEditorAporte from './PieEditorAporte.jsx'
import { hoyIso } from '../../../utils/fechas.js'
import CasillaOvillo from '../../../components/ui/CasillaOvillo.jsx'
import PreguntaGuia from '../../../components/ui/PreguntaGuia.jsx'

const SECCIONES_CON_ADJUNTOS = ['NOTA_PROFESIONAL', 'COMUNICACION', 'SENSORIAL', 'ESTRATEGIA', 'RUTINA']

export default function EditorAporte({
  seccion,
  proyectoId,
  aporte,
  alGuardar,
  alCancelar,
}) {
  const [titulo, setTitulo] = useState(aporte?.titulo ?? '')
  const [contenido, setContenido] = useState(aporte?.contenido ?? '')
  const [visibilidad, setVisibilidad] = useState(aporte?.visibilidad ?? (seccion.tipo === 'RUTINA' ? '' : 'TODOS'))
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
      ...(seccion.tipo === 'RUTINA' ? { categoria: '', contextos: [] } : {}),
      ...(seccion.tipo === 'DESREGULACION' ? { lista: '' } : {}),
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
  const esRutina = seccion.tipo === 'RUTINA'
  const esDesregulacion = seccion.tipo === 'DESREGULACION'
  const permiteAdjuntos = SECCIONES_CON_ADJUNTOS.includes(seccion.tipo)
  const sustantivo = esNota ? 'nota' : 'aporte'
  const textos = textosPorTipo[seccion.tipo] ?? {}
  const etiquetaTitulo = esRutina ? 'Título del aporte' : textos.titulo ?? 'Título'
  useEffect(() => {
    formulario.current?.querySelector('input')?.focus()
  }, [])

  async function guardar(event) {
    event.preventDefault()
    if (pendiente.current) return
    // La descripción es obligatoria en todas las secciones: su aviso se muestra junto con los demás
    const errorContenido = contenido.trim() ? '' : esNota ? 'Escribí el texto de la nota.' : 'Escribí una descripción.'
    const conContenido = (errores) => (errorContenido && !errores.contenido ? { ...errores, contenido: errorContenido } : errores)
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
      setErroresCampos(conContenido(errores))
      if (Object.keys(conContenido(errores)).length) return
    }
    if (esSensorial) {
      const errores = validarCamposSensoriales(extra, titulo)
      setErroresCampos(conContenido(errores))
      if (Object.keys(conContenido(errores)).length) return
    }
    if (esEstrategia) {
      const errores = validarCamposEstrategia(extra, contenido)
      setErroresCampos(conContenido(errores))
      if (Object.keys(conContenido(errores)).length) return
    }
    if (esRutina) {
      const errores = validarCamposRutina(extra, titulo, contenido, visibilidad)
      setErroresCampos(conContenido(errores))
      if (Object.keys(conContenido(errores)).length) return
    }
    if (esDesregulacion) {
      const errores = validarCamposDesregulacion(
        extra,
        titulo,
        contenido,
        visibilidad,
      )

      setErroresCampos(conContenido(errores))

      if (Object.keys(conContenido(errores)).length) return
    }
    if (
      !titulo.trim() ||
      titulo.trim().length > 150 ||
      errorContenido ||
      contenido.length > 10000
    ) {
      setErroresCampos((actual) => ({
        ...actual,
        titulo: !titulo.trim() || titulo.trim().length > 150 ? 'Escribí un título de hasta 150 caracteres.' : '',
        contenido: actual.contenido || errorContenido,
      }))
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
      const extraRutina = esRutina && !extra.contextos?.length ? { ...extra, contextos: '' } : extra

      await guardarAporte(proyectoId, aporte?.id, {
        tipo: seccion.tipo,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        visibilidad,
        ...(campos.length || esComunicacion || esSensorial || esEstrategia || esRutina || esDesregulacion ? { datos: JSON.stringify(datosSinVacios(sinDetalleSobrante(seccion.tipo, esComunicacion && !extra.formasComunicacion?.includes('OTRA') ? { ...extra, otraForma: '' } : extraRutina))) } : {}),
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

      {(textos.introduccion || textos.aclaracion) && (
        <div className="space-y-2">
          {textos.introduccion && (
            <p className="text-base leading-relaxed text-texto-suave">
              {textos.introduccion}
            </p>
          )}

          {textos.aclaracion && (
            <p className="text-sm text-texto-suave">
              {textos.aclaracion}
            </p>
          )}
        </div>
      )}
      <PreguntaGuia tipo={seccion.tipo} />
      {esSensorial && <CamposSensoriales extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esEstrategia && <CamposEstrategia parte="categoria" extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esRutina && <>
       <CamposRutina parte="categoria" extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />
      </>}

      {esDesregulacion && (
        <CamposDesregulacion
          extra={extra}
          setExtra={setExtra}
          errores={erroresCampos}
          disabled={enviando}
        />
      )}
      <CampoFormulario
        id={`titulo-aporte-${seccion.tipo}`}
        label={etiquetaTitulo}
        hint={
          textos.hintTitulo ??
          (esSensorial
            ? 'Resumí lo que observaste en una frase, hasta 150 caracteres'
            : esEstrategia
              ? 'Resumí la estrategia en una frase breve, hasta 150 caracteres'
              : esRutina
                ? 'Resumí lo observado en una frase.'
                : 'Obligatorio, hasta 150 caracteres')
        }
      >
        <Campo
          name="titulo"
          placeholder={textos.placeholderTitulo ?? etiquetaTitulo}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          aria-invalid={Boolean(erroresCampos.titulo)}
          maxLength={150}
          disabled={enviando}
          tamanio="base"
        />
      </CampoFormulario>

      {erroresCampos.titulo && <p role="alert" className="text-sm text-error">{erroresCampos.titulo}</p>}
      <div>
        <label
          htmlFor={`contenido-aporte-${seccion.tipo}`}
          className="mb-2 block font-semibold"
        >
          {esSensorial ? 'Descripción u observación' : esRutina ? 'Descripción' : textos.contenido ??
            (esNota ? 'Texto de la nota' : 'Descripción')}
        </label>
        <textarea
          id={`contenido-aporte-${seccion.tipo}`}
          name="contenido"
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          placeholder={textos.placeholderContenido ?? ''}
          maxLength={10000}
          rows={4}
          disabled={enviando}
          aria-required="true"
          aria-invalid={Boolean(erroresCampos.contenido)}
          className="w-full rounded-md border border-borde bg-superficie p-4 text-base text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"        />
        {textos.hintContenido && (
          <p className="mt-2 text-sm text-texto-suave">
            {textos.hintContenido}
          </p>
        )}
      </div>
      {erroresCampos.contenido && <p role="alert" className="text-sm text-error">{erroresCampos.contenido}</p>}
      {esRutina && <p className="text-sm text-texto-suave">Contá lo que ya puede hacer, dónde necesita apoyo o qué lo ayuda. No hace falta detallar cada paso.</p>}
      {esEstrategia && <CamposEstrategia extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esRutina && <CamposRutina extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
      {esSensorial && <CamposSensoriales parte="contexto" extra={extra} setExtra={setExtra} errores={erroresCampos} disabled={enviando} />}
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
                <CasillaOvillo key={valor} tamano="chico" className="rounded-full border border-borde bg-superficie px-3 py-2 has-checked:border-primario has-checked:bg-fondo" checked={extra.formasComunicacion?.includes(valor) ?? false} onChange={(event) => setExtra((actual) => ({ ...actual, formasComunicacion: event.target.checked ? [...(actual.formasComunicacion ?? []), valor] : (actual.formasComunicacion ?? []).filter((forma) => forma !== valor) }))} disabled={enviando}>
                  {etiqueta}
                </CasillaOvillo>
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
          {DETALLES_OTRO[seccion.tipo]?.campo === nombre && eligioOtro(extra[nombre]) && (
            <CampoDetalleOtro
              id={`${nombre}-otro-${seccion.tipo}`}
              valor={extra[DETALLES_OTRO[seccion.tipo].detalle]}
              onCambiar={(texto) => setExtra((actual) => ({ ...actual, [DETALLES_OTRO[seccion.tipo].detalle]: texto }))}
              disabled={enviando}
              error={erroresCampos[DETALLES_OTRO[seccion.tipo].detalle]}
            />
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
          rutina={esRutina}
        />
      )}
      {error && (
        <p ref={alerta} tabIndex={-1} role="alert" className="text-error">
          {error}
        </p>
      )}
      {esRutina && <p className="rounded-sm bg-agua/15 p-3 text-sm text-secundario">Tu nombre, rol o especialidad y la fecha se agregarán automáticamente al guardar.</p>}
      <PieEditorAporte tipo={seccion.tipo} visibilidad={visibilidad} onVisibilidad={(event) => setVisibilidad(event.target.value)} disabled={enviando} errorVisibilidad={erroresCampos.visibilidad} sustantivo={sustantivo} alCancelar={alCancelar} />
    </form>
  )
}

import { Plus, X } from '@phosphor-icons/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { archivarAporte } from '../../../api/aportes.js'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'
import EditorAporte from './EditorAporte.jsx'
import HistorialAporte from './HistorialAporte.jsx'
import { leerDatosAporte } from '../perfil.js'
import { ICONOS_APORTE } from '../iconosAporte.js'

export default function BloquePerfil({
  seccion,
  aportes,
  proyectoId,
  completo = false,
  puedeCrear = false,
  puedePedirRevision = false,
  alGuardar,
  alActualizar,
  encabezado,
}) {
  const [params, setParams] = useSearchParams()
  // El + de Información general llega con ?agregar=1: el panel arranca abierto
  const [editor, setEditor] = useState(() =>
    completo && puedeCrear && params.get('agregar') === '1' ? {} : null,
  )
  const [archivandoId, setArchivandoId] = useState(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  // 3.2: aporte cuyo historial está abierto
  const [historialDe, setHistorialDe] = useState(null)
  const disparador = useRef(null)
  const navigate = useNavigate()
  const rutaSeccion = `/proyectos/${proyectoId}/${seccion.slug}`

  // Una vez abierto, se saca ?agregar=1 de la dirección para que recargar no lo vuelva a abrir
  useEffect(() => {
    if (!completo || params.get('agregar') !== '1') return
    setParams((actuales) => {
      const siguientes = new URLSearchParams(actuales)
      siguientes.delete('agregar')
      return siguientes
    }, { replace: true })
  }, [completo, params, setParams])

  // En Información general toda la tarjeta lleva a la sección (salvo sus propios botones y links)
  function abrirSeccion(evento) {
    if (completo || evento.target.closest('a, button, input, select, textarea, label')) return
    navigate(rutaSeccion)
  }

  function abrirEditor(event, aporte = {}) {
    disparador.current = event.currentTarget
    setErrorArchivo('')
    setEditor(aporte)
  }

  function cancelar() {
    setEditor(null)
    disparador.current?.focus()
  }

  function abrirDesdeEncabezado() {
    setErrorArchivo('')
    setEditor({})
  }

  async function archivar(aporte) {
    if (archivandoId) return
    setArchivandoId(aporte.id)
    setErrorArchivo('')
    try {
      await archivarAporte(proyectoId, aporte.id)
      alGuardar?.('archivado')
    } catch (error) {
      setErrorArchivo(error.message)
    } finally {
      setArchivandoId(null)
    }
  }

  const Icon = ICONOS_APORTE[seccion.tipo]
  const esNota = seccion.tipo === 'NOTA_PROFESIONAL'
  const esSensorial = seccion.tipo === 'SENSORIAL' && completo
  // En la página de una sección los aportes van en tarjetas sueltas, con el título arriba (el encabezado)
  const esPanel = completo
  const visibles = completo ? aportes : aportes.slice(0, 3)
  const agrupados = esSensorial
    ? ['AYUDA', 'CUESTA', ''].flatMap((lista) => visibles.filter((aporte) => (leerDatosAporte(aporte.datos).lista || '') === lista))
    : visibles

  return (
    <section
      aria-labelledby={`titulo-${seccion.slug}`}
      onClick={abrirSeccion}
      className={esPanel ? 'flex min-w-0 flex-col' : 'flex min-w-0 cursor-pointer flex-col rounded-lg bg-superficie p-5 shadow-sm ring-primario/30 transition-shadow hover:shadow-md hover:ring-2 motion-reduce:transition-none sm:p-6'}
    >
        <div className={esPanel ? 'sr-only' : 'mb-3 flex items-center gap-3'}>
          <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${seccion.tono}`}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
        <h2
          id={`titulo-${seccion.slug}`}
          className="font-display text-h2 text-secundario"
        >
          {seccion.titulo}
        </h2>
        {!completo && puedeCrear && (
          <Link
            to={`${rutaSeccion}?agregar=1`}
            aria-label={`Agregar ${esNota ? 'nota' : 'aporte'} en ${seccion.titulo}`}
            title={`Agregar ${esNota ? 'nota' : 'aporte'}`}
            className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-primario text-superficie transition-colors hover:bg-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario motion-reduce:transition-none"
          >
            <Plus size={20} weight="bold" aria-hidden="true" />
          </Link>
        )}
      </div>
      {encabezado?.(abrirDesdeEncabezado)}
      {errorArchivo && (
        <p role="alert" className="mb-3 text-sm text-error">
          {errorArchivo}
        </p>
      )}
      {visibles.length ? (
        <ul className={esPanel ? 'mb-4 grid flex-1 grid-cols-1 gap-4 md:grid-cols-2' : 'mb-4 flex-1 divide-y divide-borde/40'}>
          {agrupados.map((aporte, indice) => (
            <Fragment key={aporte.id}>
            {esSensorial && (indice === 0 || leerDatosAporte(agrupados[indice - 1].datos).lista !== leerDatosAporte(aporte.datos).lista) && <li className="col-span-full"><h3 className="font-display text-h2 text-secundario">{leerDatosAporte(aporte.datos).lista === 'AYUDA' ? 'Le ayuda' : leerDatosAporte(aporte.datos).lista === 'CUESTA' ? 'Le cuesta' : 'Sin clasificar'}</h3></li>}
            <li className={esPanel ? 'rounded-lg bg-superficie p-5 shadow-sm' : ''}>
              <TarjetaAporte
                aporte={aporte}
                resumen={!completo}
                archivando={archivandoId === aporte.id}
                puedePedirRevision={puedePedirRevision}
                alActualizar={alActualizar}
                alEditar={(event) => abrirEditor(event, aporte)}
                alArchivar={() => archivar(aporte)}
                alVerHistorial={(event) => {
                  disparador.current = event.currentTarget
                  setHistorialDe(aporte)
                }}
              />
            </li>
            </Fragment>
          ))}
        </ul>
      ) : (
        <div className="mb-4 flex-1 py-3 text-texto-suave">
          <p>
            {puedeCrear
              ? esNota
                ? 'Todavía no hay notas. ¡Escribí la primera!'
                : 'Todavía no hay aportes. ¡Sumá el primero!'
              : esNota
                ? 'Todavía no hay notas visibles para vos.'
                : 'Todavía no hay aportes visibles para vos.'}
          </p>
        </div>
      )}
 
      {historialDe && (
        <HistorialAporte
          key={historialDe.id}
          proyectoId={proyectoId}
          aporte={historialDe}
          onCerrar={() => {
            setHistorialDe(null)
            disparador.current?.focus()
          }}
        />
      )}
      {/* Agregar o editar siempre abre el panel lateral derecho, en todas las secciones */}
      {editor && (
        <div className="fixed inset-0 z-60 flex justify-end bg-texto/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-panel-aporte"
            className="w-full overflow-y-auto rounded-l-2xl bg-superficie p-4 shadow-md sm:max-w-2xl"
          >
            <div className="flex items-center justify-between border-b border-borde pb-3">
              <h2
                id="titulo-panel-aporte"
                className="ml-4 font-display text-h2 text-secundario"
              >
                {`${editor.id ? 'Editar' : 'Agregar'} ${esNota ? 'nota' : 'aporte'}`}
              </h2>
              <button type="button" onClick={cancelar} aria-label="Cerrar panel de aporte" className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-primario focus-visible:outline-2 focus-visible:outline-primario">
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <EditorAporte
              key={editor.id ?? 'nuevo'}
              seccion={seccion}
              proyectoId={proyectoId}
              aporte={editor.id ? editor : null}
              alCancelar={cancelar}
              alGuardar={() => {
                setEditor(null)
                alGuardar?.('guardado')
              }}
            />
          </div>
        </div>
      )}
      {!completo && (
        // Para teclado y lectores de pantalla: con el mouse se toca toda la tarjeta
        <Link
          to={rutaSeccion}
          aria-label={`Ver todo: ${seccion.titulo}`}
          className="sr-only rounded-sm font-semibold text-primario focus-visible:not-sr-only focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          Ver todo
        </Link>
      )}
    </section>
  )
}

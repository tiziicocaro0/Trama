import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PencilSimple } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import usePerfil from './hooks/usePerfil.js'
import useAuth from '../../hooks/useAuth.js'
import { formatearFechaCalendario } from '../../utils/fechas.js'
import { actualizarProyecto } from '../../api/proyectos.js'
import { calcularEdad } from './perfil.js'
import CampoDatoNino from './components/CampoDatoNino.jsx'
import {
  GRADOS,
  TIPOS_ESCUELA,
  nombreTipoEscuela,
} from './datosEscolares.js'
import ZonaEliminarPerfil from './eliminacion/ZonaEliminarPerfil.jsx'
import useProyectoActual from '../../hooks/useProyectoActual.js'
import { avisar, avisarError } from '../../components/avisos/avisosFlotantes.js'
import Cargando from '../../components/ui/Cargando.jsx'

const definicionesCampos = [
  { nombre: 'nombre', etiqueta: 'Nombre', maxLength: 80 },
  { nombre: 'apellido', etiqueta: 'Apellido', maxLength: 80 },
  { nombre: 'apodo', etiqueta: 'Apodo', maxLength: 40, opcional: true },
  { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
  { nombre: 'escuela', etiqueta: 'Colegio', maxLength: 120 },
  {
    nombre: 'tipoEscuela',
    etiqueta: 'Tipo de escuela',
    tipo: 'selector',
    opciones: TIPOS_ESCUELA,
    vacia: 'Elegí el tipo de escuela',
  },
  {
    nombre: 'grado',
    etiqueta: 'Grado',
    maxLength: 30,
    tipo: 'selector',
    opciones: GRADOS,
    vacia: 'Elegí el grado',
  },
]

export default function DatosPersonalesPage() {
  const { id } = useParams()
  const auth = useAuth()
  const usuario = auth?.usuario ?? auth

  const { proyecto, cargando, error, reintentar } = usePerfil(id)
  // Editar los datos y eliminar el perfil (8.2) son solo para el tutor administrador de este niño.
  // Antes se leía un esAdmin de la sesión que el back no manda, así que el botón Editar no aparecía nunca.
  const { esAdmin: esAdminDelProyecto } = useProyectoActual()
  const esAdmin = esAdminDelProyecto || Boolean(auth?.esAdmin ?? usuario?.esAdmin)

  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState({})
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const hoy = new Date()
  const fechaMaxima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  function iniciarEdicion() {
    setValores({
      nombre: proyecto.nombre ?? '',
      apellido: proyecto.apellido ?? '',
      apodo: proyecto.apodo ?? '',
      fechaNacimiento: proyecto.fechaNacimiento ?? '',
      escuela: proyecto.escuela ?? '',
      tipoEscuela: proyecto.tipoEscuela ?? '',
      grado: proyecto.grado ?? '',
    })
    setErrores({})
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setErrores({})
  }

  function cambiar(evento) {
    const { name, value } = evento.target
    setValores((actual) => ({ ...actual, [name]: value }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    const nuevosErrores = {}
    const datos = {}

    for (const campo of definicionesCampos) {
      datos[campo.nombre] = (valores[campo.nombre] ?? '').trim()
      if (!campo.opcional && !datos[campo.nombre]) {
        nuevosErrores[campo.nombre] =
          campo.tipo === 'selector' ? 'Elegí una opción.' : 'Completá este dato.'
      } else if (campo.maxLength && datos[campo.nombre].length > campo.maxLength) {
        nuevosErrores[campo.nombre] = `Usá hasta ${campo.maxLength} caracteres.`
      }
    }

    if (datos.fechaNacimiento && calcularEdad(datos.fechaNacimiento) === null) {
      nuevosErrores.fechaNacimiento = 'Ingresá una fecha válida que no sea futura.'
    }

    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length) {
      evento.currentTarget
        .querySelector(`[name="${Object.keys(nuevosErrores)[0]}"]`)
        ?.focus()
      return
    }

    setGuardando(true)

    try {
      await actualizarProyecto(id, datos)
      setEditando(false)
      avisar('Datos actualizados correctamente.')
      reintentar()
    } catch (err) {
      const texto =
        err?.response?.status === 403
          ? 'No tenés permiso para editar estos datos.'
          : err?.response?.data?.mensaje ||
            'No pudimos guardar los cambios. Intentá nuevamente.'
      avisarError(texto)
    } finally {
      setGuardando(false)
    }
  }

  const camposLectura = proyecto
    ? [
        ['Nombre', proyecto.nombre],
        ['Apellido', proyecto.apellido],
        ['Apodo', proyecto.apodo],
        [
          'Fecha de nacimiento',
          formatearFechaCalendario(proyecto.fechaNacimiento),
        ],
        ['Colegio', proyecto.escuela],
        ['Tipo de escuela', nombreTipoEscuela(proyecto.tipoEscuela)],
        ['Grado', proyecto.grado],
      ]
    : []

  return (
    <main
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 pb-6 text-texto sm:px-8 sm:pb-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando ? (
          <Cargando mensaje="Cargando los datos personales…" />
        ) : error ? (
          <div className="space-y-4">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar los datos personales
            </h1>
            <p role="alert">{error}</p>
            <Boton onClick={reintentar}>Reintentar</Boton>
            <Boton to={`/proyectos/${id}`} variant="secondary">
              Volver al perfil
            </Boton>
          </div>
        ) : (
          proyecto && (
            <>
              <section
                aria-labelledby="titulo-datos-personales"
                className="rounded-lg bg-superficie p-5 shadow-sm sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <h2
                    id="titulo-datos-personales"
                    className="font-display text-h1 text-secundario"
                  >
                    Datos personales
                  </h2>
                  {esAdmin && !editando && (
                    <button
                      type="button"
                      onClick={iniciarEdicion}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primario hover:text-primario-hover"
                      aria-label="Editar datos personales"
                    >
                      <PencilSimple size={16} aria-hidden="true" />
                      Editar
                    </button>
                  )}
                </div>

                {editando ? (
                  <form
                    onSubmit={guardar}
                    noValidate
                    aria-label="Editar datos personales"
                    aria-busy={guardando}
                    className="mt-6"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      {definicionesCampos.map((campo) => (
                        <div key={campo.nombre}>
                          <CampoFormulario
                            id={`editar-${campo.nombre}`}
                            label={campo.etiqueta}
                            error={errores[campo.nombre]}
                          >
                            <CampoDatoNino
                              campo={campo}
                              valor={valores[campo.nombre]}
                              onChange={cambiar}
                              fechaMaxima={fechaMaxima}
                              disabled={guardando}
                            />
                          </CampoFormulario>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Boton type="submit" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar cambios'}
                      </Boton>
                      <Boton
                        type="button"
                        variant="secondary"
                        onClick={cancelarEdicion}
                        disabled={guardando}
                      >
                        Cancelar
                      </Boton>
                    </div>
                  </form>
                ) : (
                  <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                    {camposLectura.map(([etiqueta, valor]) => (
                      <div key={etiqueta} className="border-b border-borde pb-4">
                        <dt className="font-semibold text-secundario">
                          {etiqueta}
                        </dt>
                        <dd className="mt-2 break-words">
                          {typeof valor === 'string' && valor.trim()
                            ? valor
                            : 'No informado'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>

              {esAdmin && (
                <ZonaEliminarPerfil key={proyecto.id} proyecto={proyecto} />
              )}
            </>
          )
        )}
      </div>
    </main>
  )
}

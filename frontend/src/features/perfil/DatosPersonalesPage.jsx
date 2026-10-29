import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PencilSimple } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import CampoFecha from '../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import useAuth from '../../hooks/useAuth.js'
import { formatearFechaCalendario } from '../../utils/fechas.js'
import { actualizarProyecto } from '../../api/proyectos.js'
import { calcularEdad } from './perfil.js'

const definicionesCampos = [
  { nombre: 'nombre', etiqueta: 'Nombre', maxLength: 80 },
  { nombre: 'apellido', etiqueta: 'Apellido', maxLength: 80 },
  { nombre: 'apodo', etiqueta: 'Apodo', maxLength: 40, opcional: true },
  { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
  { nombre: 'escuela', etiqueta: 'Colegio', maxLength: 120 },
  { nombre: 'grado', etiqueta: 'Grado', maxLength: 30 },
]

export default function DatosPersonalesPage() {
  const { id } = useParams()
  const auth = useAuth()
  const usuario = auth?.usuario ?? auth
  const esAdmin =
    Boolean(auth?.esAdmin ?? usuario?.esAdmin)

  const { proyecto, cargando, error, reintentar } = usePerfil(id)

  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState({})
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const hoy = new Date()
  const fechaMaxima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  function iniciarEdicion() {
    setValores({
      nombre: proyecto.nombre ?? '',
      apellido: proyecto.apellido ?? '',
      apodo: proyecto.apodo ?? '',
      fechaNacimiento: proyecto.fechaNacimiento ?? '',
      escuela: proyecto.escuela ?? '',
      grado: proyecto.grado ?? '',
    })
    setErrores({})
    setMensaje({ tipo: '', texto: '' })
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setErrores({})
    setMensaje({ tipo: '', texto: '' })
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
        nuevosErrores[campo.nombre] = 'Completá este dato.'
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
    setMensaje({ tipo: '', texto: '' })

    try {
      await actualizarProyecto(id, datos)
      setEditando(false)
      setMensaje({ tipo: 'exito', texto: 'Datos actualizados correctamente.' })
      reintentar()
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000)
    } catch (err) {
      const texto =
        err?.response?.status === 403
          ? 'No tenés permiso para editar estos datos.'
          : err?.response?.data?.mensaje ||
            'No pudimos guardar los cambios. Intentá nuevamente.'
      setMensaje({ tipo: 'error', texto })
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
        ['Grado', proyecto.grado],
      ]
    : []

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-fondo px-4 py-6 text-texto sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando ? (
          <p role="status">Cargando los datos personales…</p>
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
              <CabeceraPerfil
                proyecto={proyecto}
                seccion={{ titulo: 'Datos personales' }}
              />
              <NavegacionPerfil proyectoId={id} />

              {mensaje.texto && (
                <div className="mb-6">
                  <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>
                </div>
              )}

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
                            {campo.tipo === 'fecha' ? (
                              <CampoFecha
                                name={campo.nombre}
                                value={valores[campo.nombre]}
                                onChange={cambiar}
                                max={fechaMaxima}
                                disabled={guardando}
                                required
                              />
                            ) : (
                              <Campo
                                name={campo.nombre}
                                type="text"
                                maxLength={campo.maxLength}
                                value={valores[campo.nombre]}
                                onChange={cambiar}
                                required={!campo.opcional}
                                disabled={guardando}
                              />
                            )}
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
            </>
          )
        )}
      </div>
    </main>
  )
}

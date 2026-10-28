import { useState } from 'react'
import { User, PencilSimple } from '@phosphor-icons/react'
import { useParams } from 'react-router-dom'
import {
  cambiarEspecialidades,
  hacerCoTutor,
  invitarMiembro,
  listarMiembros,
} from '../../api/miembros.js'
import { quitarMiembroProyecto } from '../../api/proyectos.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import Boton from '../../components/ui/Boton.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import useAuth from '../../hooks/useAuth.js'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import ModalInvitarMiembro from './components/ModalInvitarMiembro.jsx'
import usePerfil from './hooks/usePerfil.js'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'
import EspecialidadModal from './components/EspecialidadModal.jsx'

const etiquetasRol = {
  TUTOR: 'Tutor/a',
  FAMILIAR: 'Familiar',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
}

const etiquetasEspecialidad = {
  DOCENTE_PRIMARIO: 'Docente primario',
  DOCENTE_SECUNDARIO: 'Docente secundario',
  DOCENTE_EDUCACION_ESPECIAL: 'Docente de educación especial',
  MAESTRO_NIVEL_INICIAL: 'Maestro/a de nivel inicial',
  MAESTRA_INTEGRADORA: 'Maestra integradora',
  EQUIPO_ORIENTACION: 'Equipo de orientación',
  PRECEPTOR_ESCOLAR: 'Preceptor/a escolar',
  DIRECTOR_ESCUELA: 'Director/a de escuela',
  ASISTENTE_EDUCACIONAL: 'Asistente educacional',
  INSPECTOR: 'Inspector/a',
  OTRA_EDUCACION: 'Otra (educación)',
  PSICOLOGIA: 'Psicología',
  PSICOPEDAGOGIA: 'Psicopedagogía',
  FONOAUDIOLOGIA: 'Fonoaudiología',
  LOGOPEDA: 'Logopeda',
  TERAPIA_OCUPACIONAL: 'Terapia ocupacional',
  ACOMPANANTE_TERAPEUTICO: 'Acompañante terapéutico',
  PSIQUIATRIA: 'Psiquiatría',
  PSIQUIATRIA_INFANTO_JUVENIL: 'Psiquiatría infanto-juvenil',
  PEDIATRIA: 'Pediatría',
  GENETISTA: 'Genetista',
  PSICOLOGO_SOCIAL: 'Psicólogo/a social',
  TRABAJADOR_SOCIAL: 'Trabajador/a social',
  OTRA_SALUD: 'Otra (salud)',
}

function esProfesional(rol) {
  return rol === 'EDUCACION' || rol === 'SALUD'
}

function formatearEspecialidades(especialidades) {
  if (!Array.isArray(especialidades) || especialidades.length === 0) {
    return 'Especialidad no informada'
  }
  return especialidades
    .map((item) => {
      const nombre = etiquetasEspecialidad[item.especialidad] ?? item.especialidad
      return item.aclaracion ? `${nombre} · ${item.aclaracion}` : nombre
    })
    .join(' — ')
}

export default function RedPage() {
  const { id } = useParams()
  const auth = useAuth()
  const usuario = auth?.usuario ?? auth
  const rolUsuario = auth?.rol ?? usuario?.rol

  const {
    proyecto,
    datos: miembros,
    cargando,
    error,
    reintentar,
  } = usePerfil(id, listarMiembros)

  const esAdmin =
    rolUsuario === 'Admin' ||
    rolUsuario === 'ADMIN' ||
    Boolean(auth?.esAdmin ?? usuario?.esAdmin) ||
    Boolean(
      usuario?.id &&
        (miembros ?? []).some(
          (m) =>
            (m.usuarioId === usuario.id || m.id === usuario.id) && m.esAdmin,
        ),
    )

  const [eliminadosIds, setEliminadosIds] = useState([])
  const [coTutoresIds, setCoTutoresIds] = useState([])
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [convirtiendoId, setConvirtiendoId] = useState(null)
  const [modalInvitarAbierto, setModalInvitarAbierto] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  // 1.9: estado del modal de especialidades
  const [modalEspecialidad, setModalEspecialidad] = useState(false)
  const [especialidadesLocales, setEspecialidadesLocales] = useState(null)
  const [exitoEspecialidad, setExitoEspecialidad] = useState('')

  const miembrosVisibles = (miembros ?? [])
    .filter((persona) => !eliminadosIds.includes(persona.id))
    .map((persona) =>
      coTutoresIds.includes(persona.id)
        ? { ...persona, rol: 'TUTOR', esAdmin: true }
        : persona,
    )

  // Encontrar al miembro actual en la lista
  const miembroActual = miembrosVisibles.find(
    (persona) => persona.usuarioId === usuario?.id,
  )

  function nombreCompleto(persona) {
    return [persona?.nombre, persona?.apellido].filter(Boolean).join(' ').trim()
  }

  async function confirmarQuitarAcceso() {
    if (!miembroSeleccionado) return
    setEliminando(true)
    setErrorAccion('')
    setMensajeExito('')
    try {
      await quitarMiembroProyecto(id, miembroSeleccionado.id)
      setEliminadosIds((actuales) => [...actuales, miembroSeleccionado.id])
      setMiembroSeleccionado(null)
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        'No pudimos quitar el acceso a este miembro. Intentá nuevamente.'
      setErrorAccion(mensaje)
      setMiembroSeleccionado(null)
    } finally {
      setEliminando(false)
    }
  }

  async function convertirEnCoTutor(persona) {
    setConvirtiendoId(persona.id)
    setErrorAccion('')
    setMensajeExito('')
    try {
      await hacerCoTutor(id, persona.id)
      setCoTutoresIds((actuales) => [...actuales, persona.id])
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        'No pudimos convertir a este miembro en co-tutor. Intentá nuevamente.'
      setErrorAccion(mensaje)
    } finally {
      setConvirtiendoId(null)
    }
  }

  async function manejarInvitacion(datosInvitacion) {
    setErrorAccion('')
    setMensajeExito('')
    await invitarMiembro(id, datosInvitacion)
    setMensajeExito('Invitación enviada correctamente.')
  }

  async function guardarEspecialidades(lista) {
    const respuesta = await cambiarEspecialidades(id, lista)
    setEspecialidadesLocales(respuesta.especialidades ?? lista)
    setModalEspecialidad(false)
    setExitoEspecialidad('Especialidades actualizadas correctamente.')
    setTimeout(() => setExitoEspecialidad(''), 4000)
  }

  // Las especialidades del miembro actual (priorizando las actualizadas localmente)
  function obtenerEspecialidades(persona) {
    if (
      especialidadesLocales &&
      persona.usuarioId === usuario?.id
    ) {
      return especialidadesLocales
    }
    return persona.especialidades ?? []
  }

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-fondo px-4 py-6 text-texto sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        {cargando ? (
          <p role="status">Cargando la red de apoyo…</p>
        ) : error ? (
          <div className="space-y-4">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar la red
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
              <CabeceraPerfil proyecto={proyecto} seccion={{ titulo: 'Red' }} />
              <NavegacionPerfil proyectoId={id} />
              <section aria-labelledby="titulo-red">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      id="titulo-red"
                      className="font-display text-h1 text-secundario"
                    >
                      Red
                    </h2>
                    <p className="mt-2 text-texto-suave">
                      Personas que acompañan este proyecto.
                    </p>
                  </div>

                  {esAdmin && (
                    <Boton
                      onClick={() => {
                        setErrorAccion('')
                        setMensajeExito('')
                        setModalInvitarAbierto(true)
                      }}
                    >
                      Invitar miembro
                    </Boton>
                  )}
                </div>

                {exitoEspecialidad && (
                  <div className="mb-6">
                    <Aviso tipo="exito">{exitoEspecialidad}</Aviso>
                  </div>
                )}

                {mensajeExito && (
                  <div className="mb-6">
                    <Aviso tipo="exito">{mensajeExito}</Aviso>
                  </div>
                )}

                {errorAccion && (
                  <div className="mb-6">
                    <Aviso tipo="error">{errorAccion}</Aviso>
                  </div>
                )}

                {miembrosVisibles.length ? (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {miembrosVisibles.map((persona) => {
                      const nombre = nombreCompleto(persona)
                      const esMiPerfil = persona.usuarioId === usuario?.id
                      const especialidades = obtenerEspecialidades(persona)
                      return (
                        <li
                          key={persona.id}
                          className="flex flex-col justify-between gap-4 rounded-lg bg-superficie p-6 shadow-sm sm:flex-row sm:items-start"
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-decoracion text-secundario">
                              <User size={24} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="break-words font-display text-h2 text-secundario">
                                {persona.nombre} {persona.apellido}
                              </h3>
                              <p className="mt-2 font-semibold">
                                {etiquetasRol[persona.rol]}
                                {persona.esAdmin && ' · Administrador'}
                              </p>
                              {esProfesional(persona.rol) && (
                                <div className="mt-1">
                                  <p className="break-words text-texto-suave">
                                    {formatearEspecialidades(especialidades)}
                                  </p>
                                  {esMiPerfil && (
                                    <button
                                      type="button"
                                      onClick={() => setModalEspecialidad(true)}
                                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primario hover:text-primario-hover"
                                      aria-label="Editar mis especialidades"
                                    >
                                      <PencilSimple size={16} aria-hidden="true" />
                                      Editar especialidades
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {esAdmin && (
                            <div className="flex shrink-0 flex-wrap justify-end gap-2">
                              {persona.rol === 'FAMILIAR' && (
                                <Boton
                                  variante="secundario"
                                  onClick={() => convertirEnCoTutor(persona)}
                                  disabled={convirtiendoId === persona.id}
                                >
                                  Hacer co-tutor
                                </Boton>
                              )}
                              <Boton
                                variante="peligro"
                                onClick={() => {
                                  setErrorAccion('')
                                  setMiembroSeleccionado(persona)
                                }}
                                aria-label={`Quitar acceso a ${nombre}`}
                              >
                                Quitar acceso
                              </Boton>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-superficie p-6">
                    Todavía no hay miembros en esta red.
                  </p>
                )}
              </section>

              <ModalInvitarMiembro
                abierto={modalInvitarAbierto}
                onCerrar={() => setModalInvitarAbierto(false)}
                onInvitar={manejarInvitacion}
              />

              <Modal
                abierto={Boolean(miembroSeleccionado)}
                titulo="Confirmar acción"
                onCerrar={() => {
                  if (!eliminando) setMiembroSeleccionado(null)
                }}
              >
                {miembroSeleccionado && (
                  <div>
                    <p className="mb-6">
                      {`¿Quitarle el acceso a ${nombreCompleto(miembroSeleccionado)}? Sus aportes van a quedar en el perfil.`}
                    </p>
                    <div className="flex justify-end gap-3">
                      <Boton
                        variante="fantasma"
                        onClick={() => setMiembroSeleccionado(null)}
                        disabled={eliminando}
                      >
                        Cancelar
                      </Boton>
                      <Boton
                        variante="peligro"
                        onClick={confirmarQuitarAcceso}
                        disabled={eliminando}
                      >
                        Confirmar
                      </Boton>
                    </div>
                  </div>
                )}
              </Modal>

              {miembroActual && esProfesional(miembroActual.rol) && (
                <EspecialidadModal
                  abierto={modalEspecialidad}
                  onCerrar={() => setModalEspecialidad(false)}
                  onGuardar={guardarEspecialidades}
                  rol={miembroActual.rol}
                  especialidadesActuales={obtenerEspecialidades(miembroActual)}
                />
              )}
            </>
          )
        )}
      </div>
    </main>
  )
}

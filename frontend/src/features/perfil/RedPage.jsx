import { useState } from 'react'
import { User } from '@phosphor-icons/react'
import { useParams } from 'react-router-dom'
import { obtenerRedProyecto, quitarMiembroProyecto } from '../../api/proyectos.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import { Boton } from '../../components/ui/Boton.jsx'
import Button from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import useAuth from '../../hooks/useAuth.js'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'

export default function RedPage() {
  const { id } = useParams()
  const auth = useAuth()
  const usuario = auth?.usuario ?? auth
  const rolUsuario = auth?.rol ?? usuario?.rol
  const esAdmin =
    rolUsuario === 'Admin' ||
    rolUsuario === 'ADMIN' ||
    Boolean(auth?.esAdmin ?? usuario?.esAdmin)

  const {
    proyecto,
    datos: profesionales,
    cargando,
    error,
    reintentar,
  } = usePerfil(id, obtenerRedProyecto)

  const [eliminadosIds, setEliminadosIds] = useState([])
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  const profesionalesVisibles = (profesionales ?? []).filter(
    (persona) => !eliminadosIds.includes(persona.id),
  )

  function nombreCompleto(persona) {
    return [persona?.nombre, persona?.apellido].filter(Boolean).join(' ').trim()
  }

  async function confirmarQuitarAcceso() {
    if (!miembroSeleccionado) return
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await quitarMiembroProyecto(id, miembroSeleccionado.id)
      setEliminadosIds((actuales) => [...actuales, miembroSeleccionado.id])
      setMiembroSeleccionado(null)
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        'No pudimos quitar el acceso a este miembro. Intentá nuevamente.'
      setErrorEliminacion(mensaje)
      setMiembroSeleccionado(null)
    } finally {
      setEliminando(false)
    }
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
            <Button onClick={reintentar}>Reintentar</Button>
            <Button to={`/proyectos/${id}`} variant="secondary">
              Volver al perfil
            </Button>
          </div>
        ) : (
          proyecto && (
            <>
              <CabeceraPerfil proyecto={proyecto} seccion={{ titulo: 'Red' }} />
              <NavegacionPerfil proyectoId={id} />
              <section aria-labelledby="titulo-red">
                <h2
                  id="titulo-red"
                  className="font-display text-h1 text-secundario"
                >
                  Red
                </h2>
                <p className="mt-2 mb-6 text-texto-suave">
                  Profesionales que acompañan este proyecto.
                </p>

                {errorEliminacion && (
                  <div className="mb-6">
                    <Aviso tipo="error">{errorEliminacion}</Aviso>
                  </div>
                )}

                {profesionalesVisibles.length ? (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {profesionalesVisibles.map((persona) => {
                      const nombre = nombreCompleto(persona)
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
                                {persona.rol === 'SALUD' ? 'Salud' : 'Educación'}
                              </p>
                              <p className="mt-1 break-words text-texto-suave">
                                {persona.especialidad?.trim() ||
                                  'Especialidad no informada'}
                              </p>
                            </div>
                          </div>

                          {esAdmin && (
                            <div className="flex shrink-0 justify-end">
                              <Boton
                                variante="peligro"
                                onClick={() => {
                                  setErrorEliminacion('')
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
                    Todavía no hay profesionales vinculados a este
                    acompañamiento.
                  </p>
                )}
              </section>

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
            </>
          )
        )}
      </div>
    </main>
  )
}

import { User } from '@phosphor-icons/react'
import { useParams } from 'react-router-dom'
import { obtenerRedProyecto } from '../../api/proyectos.js'
import Button from '../../components/ui/Button.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'

export default function RedPage() {
  const { id } = useParams()
  const {
    proyecto,
    datos: profesionales,
    cargando,
    error,
    reintentar,
  } = usePerfil(id, obtenerRedProyecto)
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
                {profesionales.length ? (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {profesionales.map((persona) => (
                      <li
                        key={persona.id}
                        className="flex items-start gap-4 rounded-lg bg-superficie p-6 shadow-sm"
                      >
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
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-superficie p-6">
                    Todavía no hay profesionales vinculados a este
                    acompañamiento.
                  </p>
                )}
              </section>
            </>
          )
        )}
      </div>
    </main>
  )
}

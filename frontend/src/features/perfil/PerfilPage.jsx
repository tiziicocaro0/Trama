import { Heart, Sparkle } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import Boton from '../../components/ui/Boton.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import BloquePerfil from './components/BloquePerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import { LEYENDA_NOTAS, seccionesPerfil, seccionNotas } from './perfil.js'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'
import { listarAportes } from '../../api/aportes.js'

export default function PerfilPage() {
  const { id, seccion: slug } = useParams()
  const { proyecto, datos, error, cargando, reintentar } = usePerfil(
    id,
    listarAportes,
  )
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  const seccion =
    slug === seccionNotas.slug
      ? seccionNotas
      : seccionesPerfil.find((item) => item.slug === slug)
  return (
    <div className="min-h-svh bg-fondo text-texto">
      <a href="#contenido-perfil" className="skip-link">
        Saltar al contenido
      </a>
      <main
        id="contenido-perfil"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10"
      >
        {slug && !seccion ? (
          <div className="space-y-4">
            <h1 className="font-display text-h1 text-secundario">
              Sección no encontrada
            </h1>
            <Boton to={`/proyectos/${id}`} variant="secondary">
              Volver al perfil
            </Boton>
          </div>
        ) : cargando ? (
          <p role="status" className="py-12 text-center">
            Cargando el perfil…
          </p>
        ) : error ? (
          <div className="space-y-5 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">
              No pudimos mostrar el perfil
            </h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={reintentar}>Reintentar</Boton>
              <Boton to="/inicio" variant="secondary">
                Volver al inicio
              </Boton>
            </div>
          </div>
        ) : proyecto ? (
          <>
            <CabeceraPerfil proyecto={proyecto} seccion={seccion} />
            <NavegacionPerfil proyectoId={id} />
            {!seccion && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-primario/30 bg-superficie p-4 shadow-sm sm:p-5">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-primario">
                      <Sparkle size={20} aria-hidden="true" />
                      Resumen rápido del perfil
                    </p>
                    <p className="mt-1 text-sm text-texto-suave">
                      Intereses principales, cómo comunicarse, qué lo ayuda, qué
                      evitar y qué hacer si se desregula en una sola página.
                    </p>
                  </div>
                  <Boton to={`/proyectos/${id}/conocelo`}>
                    Conocelo en 5 minutos
                  </Boton>
                </div>
                <aside
                  aria-label="Si se desregula · Próximamente"
                  className="mb-6 rounded-md border border-borde bg-superficie/70 p-4 sm:p-5"
                >
                  <p className="flex items-center gap-2 font-semibold text-primario">
                    <Heart size={20} aria-hidden="true" />
                    Si se desregula{' '}
                    <span className="ml-auto text-sm font-normal text-texto-suave">
                      Próximamente
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-texto-suave">
                    Este espacio estará disponible más adelante.
                  </p>
                </aside>
              </>
            )}
            {mensajeGuardado && (
              <p role="status" className="mb-4 text-secundario">
                {mensajeGuardado}
              </p>
            )}
            {seccion?.tipo === 'NOTA_PROFESIONAL' && (
              <div className="mb-4 space-y-2">
                <Aviso>{LEYENDA_NOTAS}</Aviso>
                {proyecto.puedeCargarNotas !== true && (
                  <p className="text-sm text-texto-suave">
                    Las notas las cargan los profesionales de educación y salud.
                  </p>
                )}
              </div>
            )}
            {proyecto.puedeCargar !== true &&
              proyecto.soloLecturaPorPlan !== true && (
              <p className="mb-4 text-sm text-texto-suave">
                Podés consultar este perfil en modo de solo lectura.
              </p>
            )}
            <div
              className={
                seccion ? 'grid gap-5' : 'grid grid-cols-1 gap-5 md:grid-cols-2'
              }
            >
              {(seccion ? [seccion] : seccionesPerfil).map((item) => (
                <BloquePerfil
                  key={item.slug}
                  seccion={item}
                  aportes={datos.aportes.filter(
                    (aporte) => aporte.tipo === item.tipo,
                  )}
                  proyectoId={id}
                  completo={Boolean(seccion)}
                  puedeCrear={
                    item.tipo === 'NOTA_PROFESIONAL'
                      ? proyecto.puedeCargarNotas === true
                      : proyecto.puedeCargar === true
                  }
                  alGuardar={(accion) => {
                    const esNota = item.tipo === 'NOTA_PROFESIONAL'
                    setMensajeGuardado(
                      accion === 'archivado'
                        ? esNota
                          ? 'Nota archivada.'
                          : 'Aporte archivado.'
                        : esNota
                          ? 'Nota guardada.'
                          : 'Aporte guardado.',
                    )
                    reintentar()
                  }}
                />
              ))}
            </div>
            {seccion && (
              <Link
                to={`/proyectos/${id}`}
                className="mt-6 inline-flex min-h-11 items-center rounded-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
              >
                Volver al perfil
              </Link>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

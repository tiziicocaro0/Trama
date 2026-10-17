import { useParams } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import NavegacionPerfil from './components/NavegacionPerfil.jsx'
import usePerfil from './hooks/usePerfil.js'
import { formatearFechaCalendario } from '../../utils/fechas.js'

export default function DatosPersonalesPage() {
  const { id } = useParams()
  const { proyecto, cargando, error, reintentar } = usePerfil(id)
  const campos = proyecto
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
            <Button onClick={reintentar}>Reintentar</Button>
            <Button to={`/proyectos/${id}`} variant="secondary">
              Volver al perfil
            </Button>
          </div>
        ) : (
          proyecto && (
            <>
              <CabeceraPerfil
                proyecto={proyecto}
                seccion={{ titulo: 'Datos personales' }}
              />
              <NavegacionPerfil proyectoId={id} />
              <section
                aria-labelledby="titulo-datos-personales"
                className="rounded-lg bg-superficie p-5 shadow-sm sm:p-8"
              >
                <h2
                  id="titulo-datos-personales"
                  className="font-display text-h1 text-secundario"
                >
                  Datos personales
                </h2>
                <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                  {campos.map(([etiqueta, valor]) => (
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
              </section>
            </>
          )
        )}
      </div>
    </main>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PencilSimple, UserCircle } from '@phosphor-icons/react'
import useAuth from '../../hooks/useAuth.js'
import SeccionMatricula from './SeccionMatricula.jsx'
import FormularioMisDatos from './FormularioMisDatos.jsx'
import { subirFotoUsuario } from '../../api/fotos.js'
import EditorFoto from '../../components/ui/EditorFoto.jsx'
import useFotoUsuario from './useFotoUsuario.js'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import { nombreTipoCuenta } from '../auth/registro/tipoCuenta.js'
import { nombreEspecialidad } from '../perfil/especialidades.js'

// /perfil: los datos de la propia cuenta (se pueden corregir), su foto y, si es profesional,
// su matrícula.
export default function MiPerfilPage() {
  const { usuario, cerrarSesion, confirmarSesion } = useAuth()
  const esProfesional = usuario?.tipoCuenta === 'PROFESIONAL'
  // Cambia cada vez que se sube otra foto, para volver a pedirla.
  const [versionFoto, setVersionFoto] = useState(0)
  const [tieneFoto, setTieneFoto] = useState(Boolean(usuario?.tieneFoto))
  const foto = useFotoUsuario(usuario?.id, tieneFoto, versionFoto)
  const [editando, setEditando] = useState(false)
  // Lo último guardado se muestra al instante, sin esperar a que se actualice la sesión.
  const [guardados, setGuardados] = useState(null)
  const cuenta = { ...usuario, ...guardados }

  async function guardarFoto(imagen) {
    await subirFotoUsuario(imagen)
    setTieneFoto(true)
    setVersionFoto((actual) => actual + 1)
    // Actualiza la sesión para que el resto de TRAMA vea el cambio.
    confirmarSesion?.().catch(() => {})
  }

  function datosGuardados(actualizada) {
    setGuardados({ nombre: actualizada?.nombre, apellido: actualizada?.apellido })
    setEditando(false)
    confirmarSesion?.().catch(() => {})
  }

  const nombreCompleto = [cuenta.nombre, cuenta.apellido].filter(Boolean).join(' ')

  const datos = [
    ['Nombre', cuenta.nombre],
    ['Apellido', cuenta.apellido],
    ['Email', cuenta.email],
    ['Uso', nombreTipoCuenta(usuario?.tipoCuenta)],
    ...(esProfesional
      ? [['Especialidades', (usuario?.especialidades ?? []).map(nombreEspecialidad).join(', ')]]
      : []),
  ]

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-mi-perfil" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-mi-perfil"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <h1 className="font-display text-h1 text-secundario sm:text-display">Mi perfil</h1>
            <p className="mt-2 text-texto-suave">Tus datos en TRAMA.</p>
          </header>

          <section
            aria-label="Tu foto y tu nombre"
            className="flex flex-col items-center gap-4 rounded-lg bg-superficie p-6 text-center shadow-sm sm:flex-row sm:text-left"
          >
            <EditorFoto
              src={foto}
              nombre={cuenta.nombre ?? ''}
              tituloRecorte="Tu foto"
              onGuardar={guardarFoto}
            />
            <div className="min-w-0">
              <p className="break-words font-display text-h2 text-secundario">
                {nombreCompleto || 'Tu cuenta'}
              </p>
              <p className="break-words text-texto-suave">{cuenta.email}</p>
              <p className="mt-2 text-sm text-texto-suave">
                Tu foto la ven las redes de los niños en los que participás.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="titulo-mis-datos"
            className="rounded-lg bg-superficie p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2
                id="titulo-mis-datos"
                className="flex items-center gap-2 font-display text-h2 text-secundario"
              >
                <UserCircle size={24} aria-hidden="true" />
                Mis datos
              </h2>
              {!editando && (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  aria-label="Editar mis datos"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold text-primario hover:text-primario-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                >
                  <PencilSimple size={16} aria-hidden="true" />
                  Editar
                </button>
              )}
            </div>
            {editando ? (
              <FormularioMisDatos
                cuenta={cuenta}
                onGuardado={datosGuardados}
                onCancelar={() => setEditando(false)}
              />
            ) : (
              <dl className="grid gap-5 sm:grid-cols-2">
                {datos.map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="border-b border-borde pb-3">
                    <dt className="font-semibold text-secundario">{etiqueta}</dt>
                    <dd className="mt-1 break-words">{valor || 'No informado'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {esProfesional && (
            <SeccionMatricula usuario={usuario} onCambio={() => confirmarSesion?.().catch(() => {})} />
          )}

          <nav aria-label="Más opciones de tu cuenta" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/cuenta/notificaciones" className="font-semibold text-primario underline">
              Avisos por mail
            </Link>
            <Link to="/cuenta/plan" className="font-semibold text-primario underline">
              Mi plan
            </Link>
          </nav>
        </div>
      </main>
    </div>
  )
}

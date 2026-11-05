import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, UserCircle } from '@phosphor-icons/react'
import useAuth from '../../hooks/useAuth.js'
import SeccionMatricula from './SeccionMatricula.jsx'
import { quitarFotoUsuario, subirFotoUsuario } from '../../api/fotos.js'
import EditorFoto from '../../components/ui/EditorFoto.jsx'
import useFotoUsuario from './useFotoUsuario.js'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import { nombreTipoCuenta } from '../auth/registro/tipoCuenta.js'
import { nombreEspecialidad } from '../perfil/especialidades.js'

// /perfil: los datos de la propia cuenta, su foto y, si es profesional, su matrícula.
export default function MiPerfilPage() {
  const { usuario, cerrarSesion, confirmarSesion } = useAuth()
  const esProfesional = usuario?.tipoCuenta === 'PROFESIONAL'
  // Cambia cada vez que se sube otra foto, para volver a pedirla.
  const [versionFoto, setVersionFoto] = useState(0)
  const [tieneFoto, setTieneFoto] = useState(Boolean(usuario?.tieneFoto))
  const foto = useFotoUsuario(usuario?.id, tieneFoto, versionFoto)

  async function cambiarFoto(accion, quedaConFoto) {
    await accion()
    setTieneFoto(quedaConFoto)
    setVersionFoto((actual) => actual + 1)
    // Actualiza la sesión para que el resto de TRAMA vea el cambio.
    confirmarSesion?.().catch(() => {})
  }

  const datos = [
    ['Nombre', usuario?.nombre],
    ['Apellido', usuario?.apellido],
    ['Email', usuario?.email],
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
            aria-labelledby="titulo-mi-foto"
            className="rounded-lg bg-superficie p-6 shadow-sm"
          >
            <h2
              id="titulo-mi-foto"
              className="mb-4 flex items-center gap-2 font-display text-h2 text-secundario"
            >
              <Camera size={24} aria-hidden="true" />
              Mi foto
            </h2>
            <EditorFoto
              src={foto}
              nombre={usuario?.nombre ?? ''}
              tituloRecorte="Tu foto"
              onGuardar={(imagen) => cambiarFoto(() => subirFotoUsuario(imagen), true)}
              onQuitar={() => cambiarFoto(quitarFotoUsuario, false)}
            />
            <p className="mt-3 text-sm text-texto-suave">
              La ven las redes de los niños en los que participás.
            </p>
          </section>

          <section
            aria-labelledby="titulo-mis-datos"
            className="rounded-lg bg-superficie p-6 shadow-sm"
          >
            <h2
              id="titulo-mis-datos"
              className="mb-4 flex items-center gap-2 font-display text-h2 text-secundario"
            >
              <UserCircle size={24} aria-hidden="true" />
              Mis datos
            </h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="border-b border-borde pb-3">
                  <dt className="font-semibold text-secundario">{etiqueta}</dt>
                  <dd className="mt-1 break-words">{valor || 'No informado'}</dd>
                </div>
              ))}
            </dl>
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

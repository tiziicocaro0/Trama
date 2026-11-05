import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IdentificationCard, UserCircle } from '@phosphor-icons/react'
import useAuth from '../../hooks/useAuth.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import { actualizarMatricula } from '../../api/cuenta.js'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import { nombreTipoCuenta } from '../auth/registro/tipoCuenta.js'
import { nombreEspecialidad } from '../perfil/especialidades.js'

// /perfil: los datos de la propia cuenta. El profesional declara acá su matrícula.
export default function MiPerfilPage() {
  const { usuario, cerrarSesion, confirmarSesion } = useAuth()
  const esProfesional = usuario?.tipoCuenta === 'PROFESIONAL'
  const [matricula, setMatricula] = useState(usuario?.matricula ?? '')
  const [error, setError] = useState('')
  const [estado, setEstado] = useState({ tipo: null, texto: '' })
  const [guardando, setGuardando] = useState(false)

  async function guardar(event) {
    event.preventDefault()
    if (guardando) return
    if (matricula.trim().length > 40) {
      setError('La matrícula no puede superar los 40 caracteres.')
      return
    }
    setError('')
    setGuardando(true)
    setEstado({ tipo: null, texto: '' })
    try {
      const cuenta = await actualizarMatricula(matricula)
      setMatricula(cuenta?.matricula ?? '')
      setEstado({
        tipo: 'exito',
        texto: cuenta?.matricula ? 'Guardamos tu matrícula.' : 'Quitamos tu matrícula.',
      })
      // Actualiza la sesión para que el resto de TRAMA vea el cambio.
      confirmarSesion?.().catch(() => {})
    } catch (falla) {
      setEstado({
        tipo: 'error',
        texto:
          falla?.response?.data?.mensaje ||
          'No pudimos guardar la matrícula. Intentá nuevamente.',
      })
    } finally {
      setGuardando(false)
    }
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
            <section
              aria-labelledby="titulo-matricula"
              className="rounded-lg bg-superficie p-6 shadow-sm"
            >
              <h2
                id="titulo-matricula"
                className="mb-2 flex items-center gap-2 font-display text-h2 text-secundario"
              >
                <IdentificationCard size={24} aria-hidden="true" />
                Matrícula
              </h2>
              <p className="mb-4 text-texto-suave">
                La ve la red de cada niño en el que participás. Es opcional y la declarás vos:
                TRAMA no verifica que sea válida.
              </p>
              {estado.texto && (
                <div className="mb-4">
                  <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>
                </div>
              )}
              <form
                onSubmit={guardar}
                noValidate
                aria-label="Cambiar matrícula"
                aria-busy={guardando}
                className="flex flex-col gap-3 sm:flex-row sm:items-start"
              >
                <div className="flex-1">
                  <CampoFormulario id="mi-matricula" label="Matrícula" error={error}>
                    <Campo
                      name="matricula"
                      placeholder="Ej.: MN 45.123"
                      value={matricula}
                      onChange={(event) => {
                        setMatricula(event.target.value)
                        setError('')
                      }}
                      maxLength={40}
                      disabled={guardando}
                    />
                  </CampoFormulario>
                </div>
                <Boton type="submit" disabled={guardando} className="sm:mt-3">
                  {guardando ? 'Guardando…' : 'Guardar'}
                </Boton>
              </form>
            </section>
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

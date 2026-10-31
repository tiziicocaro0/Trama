import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SpinnerGap } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton.jsx'
import { Aviso } from '../../components/ui/Aviso.jsx'
import useAuth from '../../hooks/useAuth.js'
import { aceptarInvitacion } from '../../api/invitaciones.js'
import SelectorEspecialidades from '../perfil/components/SelectorEspecialidades.jsx'
import { esOtraEspecialidad, especialidadesDelRol } from '../perfil/especialidades.js'
import useInvitacion from './hooks/useInvitacion.js'
import { olvidarInvitacion, recordarInvitacion } from './invitacionPendiente.js'

const ROLES = {
  TUTOR: 'co-tutor/a',
  FAMILIAR: 'familiar',
  EDUCACION: 'profesional de educación',
  SALUD: 'profesional de salud',
}
const PROFESIONALES = ['EDUCACION', 'SALUD']

// 1.4 + 9.4: /invitaciones/:token, el enlace que llega por mail.
// El rol lo eligió quien invita; el profesional solo ajusta sus especialidades.
export default function AceptarInvitacionPage() {
  const { token } = useParams()
  const { usuario } = useAuth()
  const { cargando, detalle, error } = useInvitacion(token)
  const ruta = `/invitaciones/${token}`

  useEffect(() => {
    if (usuario) olvidarInvitacion()
    else recordarInvitacion(ruta)
  }, [usuario, ruta])

  return (
    <main
      tabIndex={-1}
      className="flex min-h-svh items-center justify-center bg-fondo px-4 py-10 text-texto"
    >
      <div className="w-full max-w-xl space-y-6 rounded-lg border border-borde bg-superficie p-6 shadow-sm sm:p-8">
        {cargando && <p role="status">Abriendo la invitación…</p>}
        {error && (
          <>
            <Aviso tipo="error">{error}</Aviso>
            <Boton to={usuario ? '/inicio' : '/'} variant="secondary">
              Ir a TRAMA
            </Boton>
          </>
        )}
        {detalle && (
          <>
            <header className="space-y-2">
              <h1 className="font-display text-h1 leading-tight text-primario">
                Te invitaron a la red de {detalle.nombreProyecto}
              </h1>
              <p className="text-lg">
                {detalle.nombreInvitador} te invitó como{' '}
                <strong>{ROLES[detalle.rol] ?? detalle.rol}</strong>.
              </p>
              <p className="text-texto-suave">
                El rol lo eligió quien te invitó, así la familia sabe quién es
                quién en la red.
              </p>
            </header>
            {usuario ? (
              <Unirse token={token} detalle={detalle} usuario={usuario} />
            ) : (
              <div className="space-y-3">
                <p>Para sumarte, ingresá o creá tu cuenta con el email al que te llegó la invitación.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Boton to="/login" className="flex-1">
                    Ingresar
                  </Boton>
                  <Boton to="/registro" variant="secondary" className="flex-1">
                    Crear cuenta
                  </Boton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function Unirse({ token, detalle, usuario }) {
  const navegar = useNavigate()
  const esProfesional = PROFESIONALES.includes(detalle.rol)
  const [especialidades, setEspecialidades] = useState(() =>
    esProfesional ? precargadas(usuario.especialidades, detalle.rol) : [],
  )
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function unirse() {
    if (enviando) return
    if (especialidades.some(({ especialidad, aclaracion }) => esOtraEspecialidad(especialidad) && !aclaracion.trim())) {
      setError(new Error('Contanos qué hacés en «Otra».'))
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await aceptarInvitacion(
        token,
        especialidades.map(({ especialidad, aclaracion }) => ({
          especialidad,
          aclaracion: aclaracion.trim() || null,
        })),
      )
      navegar(`/proyectos/${detalle.proyectoId}`)
    } catch (err) {
      setError(err)
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-5">
      {esProfesional && (
        <section aria-labelledby="como-figuras" className="space-y-3">
          <h2 id="como-figuras" className="text-lg font-bold">
            ¿Con qué especialidad figurás en este niño?
          </h2>
          <p className="text-texto-suave">
            Precargamos las de tu cuenta. Podés ajustarlas solo para este
            acompañamiento.
          </p>
          <SelectorEspecialidades
            id="invitacion-especialidades"
            rol={detalle.rol}
            value={especialidades}
            onChange={setEspecialidades}
            disabled={enviando}
          />
        </section>
      )}
      {error && (
        <Aviso tipo="error">
          {error.message}{' '}
          {error.codigo === 'YA_ES_MIEMBRO' && (
            <Link
              to={`/proyectos/${detalle.proyectoId}`}
              className="underline underline-offset-4"
            >
              Ir al acompañamiento
            </Link>
          )}
        </Aviso>
      )}
      <Boton onClick={unirse} disabled={enviando} className="w-full">
        {enviando && (
          <SpinnerGap
            size={20}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
        )}
        {enviando ? 'Sumándote…' : 'Unirme a la red'}
      </Boton>
    </div>
  )
}

function precargadas(especialidadesCuenta = [], rol) {
  const delRol = especialidadesDelRol(rol)
  return especialidadesCuenta
    .filter(({ especialidad }) => delRol.includes(especialidad))
    .map(({ especialidad, aclaracion }) => ({ especialidad, aclaracion: aclaracion ?? '' }))
}

import { useEffect, useRef, useState } from 'react'
import { Envelope, Key, SpinnerGap } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../../../components/ui/Logo.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import useAuth from '../../../hooks/useAuth.js'
import { reenviarVerificacion, verificarEmail } from '../../../api/auth.js'
import { validarEmail } from '../../../utils/validaciones.js'

// Para quien creó la cuenta pero no llegó a ingresar el código (por ejemplo, cerró la pestaña).
// Al entrar desde el login ya se le mandó un código nuevo si había pasado un minuto.
export default function VerificarEmailPage() {
  const { confirmarSesion } = useAuth()
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.email ?? '')
  const [codigo, setCodigo] = useState('')
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const pendiente = useRef(false)

  useEffect(() => {
    if (segundos <= 0) return undefined
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [segundos])

  async function ejecutar(accion) {
    if (pendiente.current) return
    pendiente.current = true
    setEnviando(true)
    setMensaje('')
    setAviso('')
    try {
      await accion()
    } catch (error) {
      setMensaje(error.message)
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  function activar(evento) {
    evento.preventDefault()
    const invalidos = {}
    const errorEmail = validarEmail(email)
    if (errorEmail) invalidos.email = errorEmail
    if (!/^\d{6}$/.test(codigo)) invalidos.codigo = 'Ingresá los 6 dígitos del código.'
    setErrores(invalidos)
    if (Object.keys(invalidos).length) return
    ejecutar(async () => {
      await verificarEmail({ email, codigo })
      await confirmarSesion()
    })
  }

  function reenviar() {
    if (validarEmail(email)) {
      setErrores({ email: validarEmail(email) })
      return
    }
    ejecutar(async () => {
      await reenviarVerificacion(email)
      setCodigo('')
      setSegundos(60)
      setAviso('Si la cuenta espera activación, te mandamos un código nuevo.')
    })
  }

  return (
    <main tabIndex={-1} className="min-h-svh bg-superficie px-3 py-8 text-texto sm:px-6 sm:py-12">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto w-32">
          <Logo />
        </div>
        <header className="space-y-2 text-center">
          <h1 className="font-display text-h1 text-primario">Activá tu cuenta</h1>
          <p className="text-texto-suave">
            Ingresá el código de 6 dígitos que te mandamos por mail. Revisá también spam.
          </p>
        </header>
        <form onSubmit={activar} noValidate aria-busy={enviando} className="space-y-4">
          <CampoFormulario id="verificar-email" label="Email" error={errores.email}>
            <Campo
              name="email"
              type="email"
              icon={Envelope}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviando}
              required
            />
          </CampoFormulario>
          <CampoFormulario id="verificar-codigo" label="Código de 6 dígitos" error={errores.codigo}>
            <Campo
              name="codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              icon={Key}
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="tracking-widest"
              disabled={enviando}
              required
            />
          </CampoFormulario>
          {aviso && (
            <p role="status" className="text-sm text-secundario">
              {aviso}
            </p>
          )}
          {mensaje && (
            <p role="alert" className="rounded-sm border border-error p-3 text-error">
              {mensaje}
            </p>
          )}
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando && (
              <SpinnerGap size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            )}
            Activar cuenta
          </Boton>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={reenviar}
              disabled={enviando || segundos > 0}
              className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario disabled:cursor-not-allowed disabled:text-texto-suave disabled:no-underline"
            >
              {segundos > 0 ? `Reenviar código en ${segundos} s` : 'Reenviar código'}
            </button>
            <Link
              to="/login"
              className="rounded-sm text-sm text-texto-suave hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

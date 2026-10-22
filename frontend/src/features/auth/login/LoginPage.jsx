import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Envelope, SpinnerGap } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../../components/ui/BrandLogo.jsx'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import PasswordInput from '../../../components/ui/PasswordInput.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import useAuth from '../../../hooks/useAuth.js'
import { validarEmail } from '../../../utils/validaciones.js'

export default function LoginPage() {
  const { ingresar, mensajeSesion } = useAuth()
  const [valores, setValores] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const form = useRef(null)

  useEffect(() => {
    if (Object.keys(errores).length)
      form.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [errores])

  function cambiar(event) {
    setValores((actual) => ({
      ...actual,
      [event.target.name]: event.target.value,
    }))
    setMensaje('')
  }

  async function enviar(event) {
    event.preventDefault()
    if (pendiente.current) return
    const invalidos = {}
    const email = validarEmail(valores.email)
    if (email) invalidos.email = email
    if (!valores.password.trim()) invalidos.password = 'Ingresá tu contraseña.'
    setErrores(invalidos)
    setMensaje('')
    if (Object.keys(invalidos).length) return
    pendiente.current = true
    setEnviando(true)
    try {
      await ingresar(valores)
      setValores((actual) => ({ ...actual, password: '' }))
    } catch (error) {
      setMensaje(
        error.message || 'No pudimos iniciar sesión. Intentá nuevamente.',
      )
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-superficie px-3 py-8 text-texto sm:px-6 sm:py-12"
    >
      <div className="relative mx-auto max-w-md">
        <Link
          to="/"
          aria-label="Volver a la bienvenida"
          className="absolute top-0 left-0 flex size-11 items-center justify-center rounded-sm text-primario focus-visible:outline-2 focus-visible:outline-primario"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </Link>
        <div className="mx-auto w-32 pt-4">
          <BrandLogo />
        </div>
        <svg
          viewBox="0 0 120 40"
          aria-hidden="true"
          focusable="false"
          className="mx-auto mt-8 h-10 w-28 fill-none stroke-miel"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M3 8C17 37 48 33 47 13C46-5 20 7 45 23C68 38 90 7 70 5C52 4 60 32 117 32" />
        </svg>
        <p className="mt-6 text-center text-sm font-bold tracking-widest text-secundario">
          QUÉ BUENO VERTE
        </p>
        <h1 className="mt-2 text-center font-display text-h1 text-primario">
          Hola de nuevo
        </h1>
        <p className="mt-3 text-center text-lg text-texto-suave">
          Ingresá para volver a tu red.
        </p>
        <form
          ref={form}
          onSubmit={enviar}
          noValidate
          aria-label="Iniciar sesión"
          aria-busy={enviando}
          className="mt-8 space-y-4"
        >
          <FormField id="login-email" label="Email" error={errores.email}>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              icon={Envelope}
              value={valores.email}
              onChange={cambiar}
              required
              disabled={enviando}
            />
          </FormField>
          <FormField
            id="login-password"
            label="Contraseña"
            error={errores.password}
          >
            <PasswordInput
              name="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              value={valores.password}
              onChange={cambiar}
              required
              disabled={enviando}
            />
          </FormField>
          <p className="-mt-1 text-right">
            <Link
              to="/recuperar"
              className="rounded-sm text-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          {(mensaje || mensajeSesion) && (
            <p
              role="alert"
              className="rounded-sm border border-primario p-3 text-primario"
            >
              {mensaje || mensajeSesion}
            </p>
          )}
          <Button
            type="submit"
            disabled={enviando}
            className="w-full shadow-sm"
          >
            {enviando ? (
              <>
                <SpinnerGap
                  size={20}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-texto-suave">
          ¿Todavía no tenés cuenta?{' '}
          <Link
            to="/registro"
            className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Creá una
          </Link>
        </p>
      </div>
    </main>
  )
}

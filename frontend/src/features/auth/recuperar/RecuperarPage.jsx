import { useRef, useState } from 'react'
import { ArrowLeft, Envelope, SpinnerGap } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../../components/ui/BrandLogo.jsx'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import { validarEmail } from '../../../utils/validaciones.js'
import { solicitarRecuperacion } from '../../../api/auth.js'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const pendiente = useRef(false)
  const form = useRef(null)

  function cambiar(event) {
    setEmail(event.target.value)
    setError('')
    setMensaje('')
  }

  async function enviar(event) {
    event.preventDefault()
    if (pendiente.current) return
    const errorEmail = validarEmail(email)
    setError(errorEmail || '')
    setMensaje('')
    if (errorEmail) return
    pendiente.current = true
    setEnviando(true)
    try {
      await solicitarRecuperacion({ email })
      setEnviado(true)
    } catch (err) {
      setMensaje(
        err.message || 'No pudimos procesar el pedido. Intentá nuevamente.',
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
          to="/login"
          aria-label="Volver a iniciar sesión"
          className="absolute top-0 left-0 flex size-11 items-center justify-center rounded-sm text-primario focus-visible:outline-2 focus-visible:outline-primario"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </Link>
        <div className="mx-auto w-32 pt-4">
          <BrandLogo />
        </div>
        <h1 className="mt-8 text-center font-display text-h1 text-primario">
          Recuperar contraseña
        </h1>
        <p className="mt-3 text-center text-lg text-texto-suave">
          {enviado
            ? 'Revisá tu correo para continuar.'
            : 'Ingresá tu email y te enviamos instrucciones para elegir una nueva contraseña.'}
        </p>
        {enviado ? (
          <div className="mt-8 space-y-6">
            <p
              role="status"
              className="rounded-sm border border-secundario p-3 text-center text-secundario"
            >
              Si el email está registrado, te enviamos un enlace válido por 1
              hora.
            </p>
            <Button to="/login" variant="secondary" className="w-full">
              Volver a iniciar sesión
            </Button>
          </div>
        ) : (
          <form
            ref={form}
            onSubmit={enviar}
            noValidate
            aria-label="Recuperar contraseña"
            aria-busy={enviando}
            className="mt-8 space-y-4"
          >
            <FormField id="recuperar-email" label="Email" error={error}>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                icon={Envelope}
                value={email}
                onChange={cambiar}
                required
                disabled={enviando}
              />
            </FormField>
            {mensaje && (
              <p
                role="alert"
                className="rounded-sm border border-primario p-3 text-primario"
              >
                {mensaje}
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
                  Enviando…
                </>
              ) : (
                'Enviar instrucciones'
              )}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-texto-suave">
          ¿Te acordaste la contraseña?{' '}
          <Link
            to="/login"
            className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
          >
            Ingresá acá
          </Link>
        </p>
      </div>
    </main>
  )
}

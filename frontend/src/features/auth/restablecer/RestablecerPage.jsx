import { useRef, useState } from 'react'
import { Check, CheckCircle, Lock, SpinnerGap } from '@phosphor-icons/react'
import { Link, useSearchParams } from 'react-router-dom'
import BrandLogo from '../../../components/ui/BrandLogo.jsx'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import { requisitosPassword } from '../registro/validaciones.js'
import { restablecerContrasena } from '../../../api/auth.js'

export default function RestablecerPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [valores, setValores] = useState({ password: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const pendiente = useRef(false)
  const form = useRef(null)

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
    if (
      requisitosPassword.some(({ cumple }) => !cumple(valores.password)) ||
      /[\r\n]/.test(valores.password)
    ) {
      invalidos.password =
        'La contraseña debe cumplir todos los requisitos de seguridad.'
    }
    if (valores.confirmar !== valores.password) {
      invalidos.confirmar = 'Las contraseñas no coinciden.'
    }
    setErrores(invalidos)
    setMensaje('')
    if (Object.keys(invalidos).length) return
    pendiente.current = true
    setEnviando(true)
    try {
      await restablecerContrasena({ token, password: valores.password })
      setExito(true)
    } catch (error) {
      setMensaje(
        error.message ||
          'No pudimos actualizar tu contraseña. Intentá nuevamente.',
      )
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <main
        tabIndex={-1}
        className="min-h-svh bg-superficie px-3 py-8 text-center text-texto sm:px-6 sm:py-12"
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto w-32 pt-4">
            <BrandLogo />
          </div>
          <h1 className="mt-8 font-display text-h1 text-primario">
            Enlace incompleto
          </h1>
          <p className="mt-3 text-lg text-texto-suave">
            Este enlace no incluye el código necesario. Volvé a pedir la
            recuperación de tu contraseña.
          </p>
          <Button to="/recuperar" className="mt-8 w-full shadow-sm">
            Pedir recuperación
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main
      tabIndex={-1}
      className="min-h-svh bg-superficie px-3 py-8 text-texto sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-md">
        <div className="mx-auto w-32 pt-4">
          <BrandLogo />
        </div>
        <h1 className="mt-8 text-center font-display text-h1 text-primario">
          {exito ? 'Contraseña actualizada' : 'Elegí tu nueva contraseña'}
        </h1>
        {exito ? (
          <section
            aria-labelledby="restablecer-exito"
            className="mt-8 space-y-6 text-center"
          >
            <CheckCircle
              size={48}
              aria-hidden="true"
              className="mx-auto text-exito"
            />
            <p role="status" className="text-lg text-texto">
              Ya podés iniciar sesión con tu nueva contraseña.
            </p>
            <Button to="/login" className="w-full shadow-sm">
              Ir al inicio de sesión
            </Button>
          </section>
        ) : (
          <form
            ref={form}
            onSubmit={enviar}
            noValidate
            aria-label="Restablecer contraseña"
            aria-busy={enviando}
            className="mt-8 space-y-4"
          >
            <FormField
              id="restablecer-password"
              label="Contraseña nueva"
              error={errores.password}
              hint="Usá al menos 8 caracteres, una mayúscula (A–Z), un número y un carácter especial."
            >
              <Input
                name="password"
                type="password"
                placeholder="Contraseña nueva"
                icon={Lock}
                value={valores.password}
                onChange={cambiar}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={enviando}
              />
            </FormField>
            <ul
              aria-label="Requisitos de la contraseña"
              className="space-y-2 text-sm"
            >
              {requisitosPassword.map(({ texto, cumple }) => {
                const valido = cumple(valores.password)
                return (
                  <li
                    key={texto}
                    className={`flex items-center gap-2 ${valido ? 'text-secundario' : 'text-texto-suave'}`}
                  >
                    <Check
                      aria-hidden="true"
                      size={16}
                      className={valido ? 'visible' : 'invisible'}
                    />
                    <span className="sr-only">
                      {valido ? 'Cumplido: ' : 'Pendiente: '}
                    </span>
                    {texto}
                  </li>
                )
              })}
            </ul>
            <FormField
              id="restablecer-confirmar"
              label="Repetí la contraseña"
              error={errores.confirmar}
            >
              <Input
                name="confirmar"
                type="password"
                placeholder="Repetí la contraseña"
                icon={Lock}
                value={valores.confirmar}
                onChange={cambiar}
                autoComplete="new-password"
                required
                disabled={enviando}
              />
            </FormField>
            {mensaje && (
              <p
                role="alert"
                className="rounded-sm border border-error p-3 text-error"
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
                  Guardando…
                </>
              ) : (
                'Guardar nueva contraseña'
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}

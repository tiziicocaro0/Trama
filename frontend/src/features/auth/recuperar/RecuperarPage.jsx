import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Envelope,
  Key,
  Lock,
  SpinnerGap,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../../components/ui/BrandLogo.jsx'
import Button from '../../../components/ui/Button.jsx'
import Input from '../../../components/ui/Input.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import Stepper from '../../../components/ui/Stepper.jsx'
import { validarEmail } from '../../../utils/validaciones.js'
import { requisitosPassword } from '../registro/validaciones.js'
import {
  restablecerContrasena,
  solicitarRecuperacion,
  verificarCodigo,
} from '../../../api/auth.js'

const SEGUNDOS_REENVIO = 60

const titulos = [
  'Recuperar contraseña',
  'Ingresá el código',
  'Elegí tu nueva contraseña',
]
const botones = ['Enviar código', 'Verificar código', 'Guardar nueva contraseña']
const cargando = ['Enviando…', 'Verificando…', 'Guardando…']

export default function RecuperarPage() {
  const [etapa, setEtapa] = useState(0)
  const [exito, setExito] = useState(false)
  const [valores, setValores] = useState({
    email: '',
    codigo: '',
    password: '',
    confirmar: '',
  })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [segundosReenvio, setSegundosReenvio] = useState(0)
  const pendiente = useRef(false)
  const form = useRef(null)
  const titulo = useRef(null)

  useEffect(() => {
    titulo.current?.focus()
  }, [etapa, exito])

  useEffect(() => {
    if (Object.keys(errores).length)
      form.current?.querySelector('[aria-invalid="true"]')?.focus()
  }, [errores])

  useEffect(() => {
    if (segundosReenvio <= 0) return undefined
    const id = setTimeout(() => setSegundosReenvio((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [segundosReenvio])

  function cambiar(event) {
    const { name, value } = event.target
    setValores((actual) => ({
      ...actual,
      [name]: name === 'codigo' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }))
    setMensaje('')
  }

  function validar() {
    const invalidos = {}
    if (etapa === 0) {
      const errorEmail = validarEmail(valores.email)
      if (errorEmail) invalidos.email = errorEmail
    }
    if (etapa === 1 && !/^\d{6}$/.test(valores.codigo)) {
      invalidos.codigo = 'Ingresá los 6 dígitos del código.'
    }
    if (etapa === 2) {
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
    }
    return invalidos
  }

  async function ejecutar(accion) {
    if (pendiente.current) return
    pendiente.current = true
    setEnviando(true)
    setMensaje('')
    try {
      await accion()
    } catch (error) {
      setMensaje(error.message || 'Ocurrió un error. Intentá nuevamente.')
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  function enviar(event) {
    event.preventDefault()
    if (pendiente.current) return
    const invalidos = validar()
    setErrores(invalidos)
    setMensaje('')
    if (Object.keys(invalidos).length) return
    const { email, codigo, password } = valores
    ejecutar(async () => {
      if (etapa === 0) {
        await solicitarRecuperacion({ email })
        setAviso(
          'Si el email está registrado, te enviamos un código de 6 dígitos. Revisá también la carpeta de spam.',
        )
        setSegundosReenvio(SEGUNDOS_REENVIO)
        setEtapa(1)
      } else if (etapa === 1) {
        await verificarCodigo({ email, codigo })
        setAviso('')
        setEtapa(2)
      } else {
        await restablecerContrasena({ email, codigo, password })
        setExito(true)
      }
    })
  }

  function reenviar() {
    ejecutar(async () => {
      await solicitarRecuperacion({ email: valores.email })
      setValores((actual) => ({ ...actual, codigo: '' }))
      setErrores({})
      setAviso('Te enviamos un código nuevo. El anterior ya no sirve.')
      setSegundosReenvio(SEGUNDOS_REENVIO)
    })
  }

  function cambiarEmail() {
    setValores({ email: valores.email, codigo: '', password: '', confirmar: '' })
    setErrores({})
    setMensaje('')
    setAviso('')
    setEtapa(0)
  }

  const subtitulos = [
    'Ingresá tu email y te mandamos un código de 6 dígitos para elegir una nueva contraseña.',
    `Lo enviamos a ${valores.email.trim()}. Vence en 10 minutos.`,
    'Usá una contraseña que no hayas usado antes en TRAMA.',
  ]

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
        <div className="mt-8">
          <Stepper
            steps={['Email', 'Código', 'Contraseña']}
            current={etapa}
            complete={exito}
            label="Etapas de la recuperación"
          />
        </div>

        {exito ? (
          <section
            aria-labelledby="recuperar-titulo"
            className="mt-10 space-y-6 text-center"
          >
            <CheckCircle
              size={48}
              aria-hidden="true"
              className="mx-auto text-exito"
            />
            <h1
              id="recuperar-titulo"
              ref={titulo}
              tabIndex={-1}
              className="font-display text-h1 text-primario outline-none"
            >
              Contraseña actualizada
            </h1>
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
            aria-labelledby="recuperar-titulo"
            aria-busy={enviando}
            className="mt-10"
          >
            <h1
              id="recuperar-titulo"
              ref={titulo}
              tabIndex={-1}
              className="text-center font-display text-h1 text-primario outline-none"
            >
              {titulos[etapa]}
            </h1>
            <p className="mt-3 text-center text-lg break-words text-texto-suave">
              {subtitulos[etapa]}
            </p>

            <div className="mt-8 space-y-4">
              {aviso && (
                <p
                  role="status"
                  className="rounded-sm border border-secundario p-3 text-secundario"
                >
                  {aviso}
                </p>
              )}

              {etapa === 0 && (
                <FormField
                  id="recuperar-email"
                  label="Email"
                  error={errores.email}
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    icon={Envelope}
                    value={valores.email}
                    onChange={cambiar}
                    maxLength={254}
                    required
                    disabled={enviando}
                  />
                </FormField>
              )}

              {etapa === 1 && (
                <FormField
                  id="recuperar-codigo"
                  label="Código de 6 dígitos"
                  error={errores.codigo}
                >
                  <Input
                    name="codigo"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Código de 6 dígitos"
                    icon={Key}
                    value={valores.codigo}
                    onChange={cambiar}
                    maxLength={6}
                    className="tracking-widest"
                    required
                    disabled={enviando}
                  />
                </FormField>
              )}

              {etapa === 2 && (
                <>
                  <FormField
                    id="recuperar-password"
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
                    id="recuperar-confirmar"
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
                </>
              )}

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
                    {cargando[etapa]}
                  </>
                ) : (
                  botones[etapa]
                )}
              </Button>

              {etapa === 1 && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={reenviar}
                    disabled={enviando || segundosReenvio > 0}
                    className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario disabled:cursor-not-allowed disabled:text-texto-suave disabled:no-underline"
                  >
                    {segundosReenvio > 0
                      ? `Reenviar código en ${segundosReenvio} s`
                      : 'Reenviar código'}
                  </button>
                  <button
                    type="button"
                    onClick={cambiarEmail}
                    disabled={enviando}
                    className="rounded-sm text-sm text-texto-suave hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
                  >
                    Usar otro email
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {!exito && (
          <p className="mt-6 text-center text-texto-suave">
            ¿Te acordaste la contraseña?{' '}
            <Link
              to="/login"
              className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
            >
              Ingresá acá
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}

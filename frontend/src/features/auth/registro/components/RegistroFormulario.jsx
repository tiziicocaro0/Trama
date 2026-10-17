import {
  ArrowLeft,
  CaretRight,
  Check,
  Envelope,
  Lock,
  SpinnerGap,
  User,
} from '@phosphor-icons/react'
import { Link } from 'react-router'
import Button from '../../../../components/ui/Button.jsx'
import Input from '../../../../components/ui/Input.jsx'
import FormField from '../../../../components/ui/FormField.jsx'
import { requisitosPassword } from '../validaciones.js'

export default function RegistroFormulario({ registro, formRef, titleRef }) {
  const {
    valores,
    etapa,
    errores,
    mensaje,
    enviando,
    cambiar,
    volver,
    avanzar,
  } = registro
  const titulos = ['Tus datos', 'Tu seguridad', 'Confirmá tus datos']
  const subtitulos = [
    'Contanos un poco sobre vos.',
    'Elegí una contraseña para cuidar tu cuenta.',
    'Revisá la información antes de crear tu cuenta.',
  ]

  function campo(nombre, label, Icon, props = {}) {
    return (
      <FormField
        id={`registro-${nombre}`}
        label={label}
        error={errores[nombre]}
      >
        <Input
          name={nombre}
          placeholder={label}
          icon={Icon}
          value={valores[nombre]}
          onChange={cambiar}
          disabled={enviando}
          required
          {...props}
        />
      </FormField>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={avanzar}
      noValidate
      aria-labelledby="registro-titulo"
      aria-busy={enviando}
      className="mt-12 lg:mt-16"
    >
      <h2
        id="registro-titulo"
        ref={titleRef}
        tabIndex={-1}
        className="font-identidad text-h1 leading-tight text-primario outline-none lg:text-registro-etapa"
      >
        {titulos[etapa]}
      </h2>
      <p className="mt-3 text-subtitulo text-texto-suave">
        {subtitulos[etapa]}
      </p>
      <div className="mt-7 space-y-4">
        {etapa === 0 && (
          <>
            {campo('nombre', 'Nombre', User, {
              autoComplete: 'given-name',
              maxLength: 80,
            })}
            {campo('apellido', 'Apellido', User, {
              autoComplete: 'family-name',
              maxLength: 80,
            })}
            {campo('email', 'Email', Envelope, {
              type: 'email',
              autoComplete: 'email',
              maxLength: 254,
            })}
          </>
        )}
        {etapa === 1 && (
          <>
            <FormField
              id="registro-password"
              label="Contraseña"
              error={errores.password}
              hint="Usá al menos 8 caracteres, una mayúscula (A–Z), un número y un carácter especial."
            >
              <Input
                name="password"
                type="password"
                placeholder="Contraseña"
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
          </>
        )}
        {etapa === 2 && (
          <dl className="space-y-5 rounded-control border border-borde p-6">
            {[
              ['Nombre', valores.nombre],
              ['Apellido', valores.apellido],
              ['Email', valores.email],
            ].map(([label, valor]) => (
              <div key={label}>
                <dt className="text-sm text-texto-suave">{label}</dt>
                <dd className="mt-1 break-words text-lg text-texto">{valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {mensaje && (
        <p
          role="alert"
          className="mt-4 rounded-pequeno border border-error p-3 text-error"
        >
          {mensaje}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={enviando}
          className="w-full shadow-suave"
        >
          {enviando ? (
            <>
              <SpinnerGap
                size={20}
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
              Creando cuenta…
            </>
          ) : (
            <>
              {etapa === 2 ? 'Crear cuenta' : 'Continuar'}
              <CaretRight aria-hidden="true" size={20} />
            </>
          )}
        </Button>
        {etapa > 0 && (
          <Button variant="secondary" disabled={enviando} onClick={volver}>
            <ArrowLeft size={20} aria-hidden="true" />
            Volver
          </Button>
        )}
      </div>
      <p className="mt-6 text-center text-texto-suave">
        ¿Ya tenés cuenta?{' '}
        <Link
          to="/login"
          className="rounded-pequeno font-bold text-primario underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario"
        >
          Ingresá acá
        </Link>
      </p>
    </form>
  )
}

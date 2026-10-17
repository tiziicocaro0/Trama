import { validarEmail } from '../../../utils/validaciones.js'

export const camposDatos = ['nombre', 'apellido', 'email']

export const requisitosPassword = [
  { texto: 'Al menos 8 caracteres', cumple: (valor) => valor.length >= 8 },
  { texto: 'Una mayúscula (A–Z)', cumple: (valor) => /[A-Z]/.test(valor) },
  { texto: 'Un número', cumple: (valor) => /[0-9]/.test(valor) },
  {
    texto: 'Un carácter especial',
    cumple: (valor) => /[^a-zA-Z0-9]/.test(valor),
  },
]

export function validarRegistro(valores, etapa = 2) {
  const errores = {}
  if (etapa !== 1) {
    for (const campo of ['nombre', 'apellido']) {
      const etiqueta = campo === 'nombre' ? 'nombre' : 'apellido'
      if (!valores[campo].trim()) errores[campo] = `Ingresá tu ${etiqueta}.`
      else if (valores[campo].length > 80)
        errores[campo] = `El ${etiqueta} no puede superar los 80 caracteres.`
    }
    const errorEmail = validarEmail(valores.email)
    if (errorEmail) errores.email = errorEmail
    else if (valores.email.length > 254)
      errores.email = 'El email no puede superar los 254 caracteres.'
  }
  if (etapa !== 0) {
    if (!valores.password.trim()) errores.password = 'Ingresá una contraseña.'
    else if (
      requisitosPassword.some(({ cumple }) => !cumple(valores.password)) ||
      /[\r\n]/.test(valores.password)
    ) {
      errores.password =
        'La contraseña debe cumplir todos los requisitos de seguridad.'
    }
  }
  return errores
}

import { validarEmail } from '../../../utils/validaciones.js'

export const camposDatos = ['nombre', 'apellido', 'email']
export const camposTipoCuenta = ['tipoCuenta', 'area', 'especialidades']

// Etapas: 0 datos, 1 tipo de cuenta (9.4), 2 contraseña, 3 revisión, 4 código del mail.
export const ETAPA_CONFIRMACION = 3
export const ETAPA_CODIGO = 4

export const requisitosPassword = [
  { texto: 'Al menos 8 caracteres', cumple: (valor) => valor.length >= 8 },
  { texto: 'Una mayúscula (A–Z)', cumple: (valor) => /[A-Z]/.test(valor) },
  { texto: 'Un número', cumple: (valor) => /[0-9]/.test(valor) },
  {
    texto: 'Un carácter especial',
    cumple: (valor) => /[^a-zA-Z0-9]/.test(valor),
  },
]

export function validarRegistro(valores, etapa = ETAPA_CONFIRMACION) {
  const errores = {}
  const todas = etapa === ETAPA_CONFIRMACION
  if (etapa === 0 || todas) {
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
  if (etapa === 1 || todas) {
    if (!valores.tipoCuenta)
      errores.tipoCuenta = 'Elegí si sos familia o profesional.'
    else if (valores.tipoCuenta === 'PROFESIONAL') {
      if (!valores.area) errores.area = 'Elegí si trabajás en educación o en salud.'
      else if (!valores.especialidades.length)
        errores.especialidades = 'Elegí al menos una especialidad.'
      else if (valores.especialidades.length > 10)
        errores.especialidades = 'Podés elegir hasta 10 especialidades.'
      else if (
        valores.especialidades.some(
          ({ especialidad, aclaracion }) =>
            /^OTRA_/.test(especialidad) && !aclaracion.trim(),
        )
      )
        errores.especialidades = 'Contanos qué hacés en «Otra».'
    }
  }
  if (etapa === 2 || todas) {
    if (!valores.password.trim()) errores.password = 'Ingresá una contraseña.'
    else if (
      requisitosPassword.some(({ cumple }) => !cumple(valores.password)) ||
      /[\r\n]/.test(valores.password)
    ) {
      errores.password =
        'La contraseña debe cumplir todos los requisitos de seguridad.'
    }
  }
  if (etapa === ETAPA_CODIGO && !/^\d{6}$/.test(valores.codigo ?? ''))
    errores.codigo = 'Ingresá los 6 dígitos del código.'
  return errores
}

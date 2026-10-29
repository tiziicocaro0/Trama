export function validarEmail(email) {
  if (!email.trim()) return 'Ingresá tu email.'
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return 'Ingresá un email válido.'
  return undefined
}

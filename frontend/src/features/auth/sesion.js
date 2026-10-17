// Solo se usa exp para programar el cierre; la identidad la verifica /auth/yo.
export function vencimientoToken(token) {
  try {
    const partes = token.split('.')
    if (partes.length !== 3) return 0
    const base = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(
      atob(base.padEnd(Math.ceil(base.length / 4) * 4, '=')),
    )
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : 0
  } catch {
    // Una estructura inválida se trata como una sesión vencida.
    return 0
  }
}

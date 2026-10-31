// 9.1: textos y formatos de la página Mi plan. Los precios vienen siempre de la API.
export const NOMBRES_PLAN = {
  GRATUITO: 'Plan gratuito',
  MENSUAL: 'Suscripción mensual',
  SEMESTRAL: 'Suscripción semestral',
  INSTITUCIONAL: 'Licencia institucional',
}

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatearPesos(monto) {
  return formatoPesos.format(monto)
}

export function describirPeriodo({ meses }) {
  return meses === 1 ? 'por mes' : `por ${meses} meses`
}

// 9.2: «15 niños», «Sin límite»…
export function describirCupo(cupo, singular, plural) {
  if (cupo === null || cupo === undefined) return `${plural} sin límite`
  return `${cupo} ${cupo === 1 ? singular : plural}`
}

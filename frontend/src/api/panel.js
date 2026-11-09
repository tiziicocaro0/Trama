import cliente from './cliente.js'

// 7.1: Obtiene el resumen del panel profesional con novedades de los últimos 7 días y estado de lectura.
export async function obtenerResumenPanel() {
  const { data } = await cliente.get('/panel')
  return data
}


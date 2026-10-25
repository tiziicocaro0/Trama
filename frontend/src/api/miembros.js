import cliente from './cliente.js'

const ROLES = ['TUTOR', 'FAMILIAR', 'EDUCACION', 'SALUD']

// 1.3: miembros del proyecto (la página Red). Una sola fuente: GET /miembros.
export async function listarMiembros(proyectoId, signal) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/miembros`,
    { signal },
  )
  if (
    !Array.isArray(data) ||
    data.some(
      (miembro) =>
        !miembro?.id ||
        typeof miembro.nombre !== 'string' ||
        typeof miembro.apellido !== 'string' ||
        !ROLES.includes(miembro.rol),
    )
  ) {
    throw new Error('No pudimos verificar los miembros de la red.')
  }
  return data
}

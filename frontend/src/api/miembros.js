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

export async function invitarMiembro(proyectoId, { email, rol }) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.post(
    `/proyectos/${encodeURIComponent(proyectoId)}/invitaciones`,
    { email: email?.trim(), rol },
  )
  return data
}

export async function hacerCoTutor(proyectoId, miembroId) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.put(
    `/proyectos/${encodeURIComponent(proyectoId)}/miembros/${encodeURIComponent(miembroId)}/co-tutor`,
  )
  return data
}

// 1.9: guardar las especialidades del miembro actual.
// PUT /api/proyectos/{id}/miembros/me/especialidades
export async function cambiarEspecialidades(proyectoId, especialidades) {
  if (!cliente.defaults.baseURL)
    throw new Error('Falta configurar la conexión con TRAMA.')
  const { data } = await cliente.put(
    `/proyectos/${encodeURIComponent(proyectoId)}/miembros/me/especialidades`,
    { especialidades },
  )
  return data
}

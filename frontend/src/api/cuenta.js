import cliente from './cliente.js'

// Mi perfil: la matrícula que declara el profesional. Vacía la borra.
// Devuelve los datos de la cuenta, igual que /auth/yo.
export async function actualizarMatricula(matricula) {
  const { data } = await cliente.put('/usuarios/yo/matricula', {
    matricula: matricula.trim() || null,
  })
  return data
}

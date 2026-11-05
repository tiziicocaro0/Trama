import cliente from './cliente.js'

// Fotos de perfil: la del niño (archivo del proyecto) y la de cada cuenta.
// El front sube siempre la imagen ya recortada.

function formulario(imagen) {
  const datos = new FormData()
  datos.append('archivo', imagen, 'foto.jpg')
  return datos
}

export async function subirFotoProyecto(proyectoId, imagen) {
  const { data } = await cliente.post(
    `/proyectos/${encodeURIComponent(proyectoId)}/foto`,
    formulario(imagen),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function quitarFotoProyecto(proyectoId) {
  await cliente.delete(`/proyectos/${encodeURIComponent(proyectoId)}/foto`)
}

export async function subirFotoUsuario(imagen) {
  await cliente.post('/usuarios/yo/foto', formulario(imagen), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function quitarFotoUsuario() {
  await cliente.delete('/usuarios/yo/foto')
}

// Devuelve una URL local (blob) para usar en un <img>, o null si la persona no tiene foto.
export async function obtenerFotoUsuario(usuarioId, signal) {
  try {
    const { data } = await cliente.get(`/usuarios/${encodeURIComponent(usuarioId)}/foto`, {
      responseType: 'blob',
      ...(signal ? { signal } : {}),
    })
    return window.URL.createObjectURL(data instanceof Blob ? data : new Blob([data]))
  } catch (error) {
    if (error?.response?.status === 404) return null
    throw error
  }
}

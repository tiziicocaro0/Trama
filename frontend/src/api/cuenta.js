import cliente from './cliente.js'

// Mi perfil: la matrícula que declara el profesional y su comprobante opcional.
// Las funciones que cambian algo devuelven los datos de la cuenta, igual que /auth/yo.

export async function actualizarMatricula(matricula) {
  const { data } = await cliente.put('/usuarios/yo/matricula', {
    matricula: matricula.trim() || null,
  })
  return data
}

export async function subirComprobanteMatricula(archivo) {
  const datos = new FormData()
  datos.append('archivo', archivo, archivo.name)
  const { data } = await cliente.post('/usuarios/yo/matricula/comprobante', datos, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function quitarComprobanteMatricula() {
  const { data } = await cliente.delete('/usuarios/yo/matricula/comprobante')
  return data
}

// Devuelve una URL local (blob) del comprobante, para abrirlo en otra pestaña.
export async function obtenerComprobanteMatricula(usuarioId) {
  const respuesta = await cliente.get(
    `/usuarios/${encodeURIComponent(usuarioId)}/matricula/comprobante`,
    { responseType: 'blob' },
  )
  const tipo = respuesta.headers?.['content-type'] || 'application/pdf'
  const blob =
    respuesta.data instanceof Blob ? respuesta.data : new Blob([respuesta.data], { type: tipo })
  return window.URL.createObjectURL(blob)
}

// Nombre y apellido de la cuenta. El email no se cambia desde acá.
export async function actualizarMisDatos({ nombre, apellido }) {
  const { data } = await cliente.put('/usuarios/yo', {
    nombre: nombre.trim(),
    apellido: apellido.trim(),
  })
  return data
}

// 7.0: la vista simple se guarda en la cuenta, así se mantiene al volver a entrar
export async function actualizarVistaSimple(activa) {
  const { data } = await cliente.put('/usuarios/yo/vista-simple', { activa })
  return data
}

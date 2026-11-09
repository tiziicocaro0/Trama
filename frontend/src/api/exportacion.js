import cliente from './cliente.js'

// 8.1: el tutor descarga toda la información del niño, en PDF o en JSON.
// El nombre del archivo no lleva el nombre del niño.
// filtros (solo PDF): { desde, hasta, tipos: [], usuarios: [] }; sin filtros, todo.
export async function descargarTodosLosDatos(proyectoId, formato, filtros = {}) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/exportar`,
    { params: { formato, ...parametrosDeFiltro(filtros) }, responseType: 'blob' },
  )
  const blob =
    respuesta.data instanceof Blob ? respuesta.data : new Blob([respuesta.data])
  const hoy = new Date()
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const url = window.URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `trama-datos-${fecha}.${formato}`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.URL.revokeObjectURL?.(url)
}

// Las listas van separadas por coma (tipos=FAMILIA,DOCENTE): así las lee Spring
function parametrosDeFiltro({ desde, hasta, tipos, usuarios }) {
  const parametros = {}
  if (desde) parametros.desde = desde
  if (hasta) parametros.hasta = hasta
  if (tipos?.length) parametros.tipos = tipos.join(',')
  if (usuarios?.length) parametros.usuarios = usuarios.join(',')
  return parametros
}

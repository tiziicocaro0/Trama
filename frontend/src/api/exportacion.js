import cliente from './cliente.js'

// 8.1: el tutor descarga toda la información del niño, en PDF o en JSON.
// El nombre del archivo no lleva el nombre del niño.
// filtros (solo PDF): { desde, hasta, tipos: [], usuarios: [] }; sin filtros, todo.
export async function descargarTodosLosDatos(proyectoId, formato, filtros = {}) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/exportar`,
    { params: { formato, ...parametrosDeFiltro(filtros) }, responseType: 'blob' },
  )
  guardarArchivo(respuesta.data, `trama-datos-${hoy()}.${formato}`)
}

// La fecha de hoy en la compu (AAAA-MM-DD), para el nombre del archivo
function hoy() {
  const fecha = new Date()
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

// Hace que el navegador baje el archivo con ese nombre
function guardarArchivo(datos, nombre) {
  const blob = datos instanceof Blob ? datos : new Blob([datos])
  const url = window.URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
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

// 8.4: cada miembro descarga lo que cargó en un niño (solo sus aportes, también los archivados)
export async function descargarMisAportes(proyectoId, formato) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/mis-aportes/exportar`,
    { params: { formato }, responseType: 'blob' },
  )
  guardarArchivo(respuesta.data, `trama-mis-aportes-${hoy()}.${formato}`)
}

// 8.3: el perfil o "Conocelo en 5 minutos" en PDF (cualquier miembro, solo lo que puede ver)
export async function descargarPdfPerfil(proyectoId, seccion) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/exportar-perfil`,
    { params: { seccion }, responseType: 'blob' },
  )
  guardarArchivo(respuesta.data, `trama-${seccion}-${hoy()}.pdf`)
}

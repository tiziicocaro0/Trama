import cliente from './cliente.js'

// 8.1: el tutor descarga toda la información del niño, en PDF o en JSON.
// El nombre del archivo no lleva el nombre del niño.
// filtros (solo PDF): { desde, hasta, tipos: [], usuarios: [] }; sin filtros, todo.
export async function descargarTodosLosDatos(proyectoId, formato, filtros = {}) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/exportar`,
    { params: { formato, ...parametrosDeFiltro(filtros) }, responseType: 'blob' },
  )
  guardarArchivo(respuesta.data, `trama-datos-${hoyIso()}.${formato}`)
}

// 8.3: "Conocelo en 5 minutos" (seccion 'conocelo') o el perfil ('perfil') en PDF.
// Cualquier miembro puede descargarlo; trae solo lo que esa persona puede ver.
export async function descargarPerfilPdf(proyectoId, seccion) {
  const respuesta = await cliente.get(
    `/proyectos/${encodeURIComponent(proyectoId)}/exportar-perfil`,
    { params: { seccion }, responseType: 'blob' },
  )
  guardarArchivo(respuesta.data, `trama-${seccion}-${hoyIso()}.pdf`)
}

function hoyIso() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

// Descarga el archivo en el navegador con un enlace temporal
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

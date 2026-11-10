// 2.7: una rutina guarda sus pasos en orden dentro de "datos":
// { pasos: [{ texto, archivoId }] }. La imagen de cada paso viaja también en archivoIds,
// por eso en la tarjeta y en el editor se separa de los demás adjuntos.

export const MAXIMO_PASOS = 20
export const LARGO_MAXIMO_PASO = 300

let contador = 0
// Clave estable para React mientras se agregan, quitan o mueven pasos
export function nuevaClavePaso() {
  contador += 1
  return `paso-${contador}`
}

export function leerPasos(datos) {
  return Array.isArray(datos?.pasos)
    ? datos.pasos.filter((paso) => typeof paso?.texto === 'string' && paso.texto.trim())
    : []
}

export function idsImagenesPasos(datos) {
  return new Set(leerPasos(datos).map((paso) => paso.archivoId).filter(Boolean))
}

// Del aporte guardado a lo que edita el formulario: cada paso con su archivo completo
export function pasosParaEditar(datos, archivos = []) {
  return leerPasos(datos).map((paso) => ({
    clave: nuevaClavePaso(),
    texto: paso.texto,
    archivo: archivos.find((archivo) => archivo.id === paso.archivoId) ?? null,
  }))
}

// Del formulario a "datos": se descartan los pasos vacíos
export function pasosParaGuardar(pasos) {
  return pasos
    .filter((paso) => paso.texto.trim())
    .map((paso) => ({ texto: paso.texto.trim(), ...(paso.archivo ? { archivoId: paso.archivo.id } : {}) }))
}

export function validarPasos(pasos) {
  if (pasos.length > MAXIMO_PASOS) return `La rutina puede tener hasta ${MAXIMO_PASOS} pasos.`
  if (pasos.some((paso) => !paso.texto.trim() && paso.archivo)) return 'Escribí qué hay que hacer en cada paso con imagen.'
  if (pasos.some((paso) => paso.texto.trim().length > LARGO_MAXIMO_PASO)) return `Cada paso puede tener hasta ${LARGO_MAXIMO_PASO} caracteres.`
  return ''
}

export function moverPaso(pasos, indice, direccion) {
  const destino = indice + direccion
  if (destino < 0 || destino >= pasos.length) return pasos
  const copia = [...pasos]
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}

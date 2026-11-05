// Recorta la zona elegida en el recortador y la devuelve como un JPG cuadrado.
// Se sube solo esto (unos 50–100 KB), no la foto original del celular.
export const LADO_FOTO = 512

export function cargarImagen(src) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image()
    imagen.onload = () => resolver(imagen)
    imagen.onerror = () => rechazar(new Error('No pudimos abrir la imagen.'))
    imagen.src = src
  })
}

export async function recortarImagen(src, zona, lado = LADO_FOTO) {
  const imagen = await cargarImagen(src)
  const lienzo = document.createElement('canvas')
  lienzo.width = lado
  lienzo.height = lado
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('Tu navegador no permite recortar imágenes.')
  // Fondo claro por si la imagen es un PNG con partes transparentes (el JPG no las tiene).
  contexto.fillStyle = 'white'
  contexto.fillRect(0, 0, lado, lado)
  contexto.drawImage(imagen, zona.x, zona.y, zona.width, zona.height, 0, 0, lado, lado)
  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error('No pudimos recortar la imagen.'))),
      'image/jpeg',
      0.9,
    )
  })
}

// Opciones de los datos escolares del niño, compartidas por el alta y la edición.

// Primaria: de 1.º a 7.º (en algunas provincias termina en 6.º).
// El grado se guarda como texto, con el mismo formato que ya usaban los perfiles.
export const GRADOS = [1, 2, 3, 4, 5, 6, 7].map((numero) => ({
  valor: `${numero}.º grado`,
  etiqueta: `${numero}.º grado`,
}))

// Los valores coinciden con el enum TipoEscuela del back (lo revisa ContratoFrontendTest).
export const TIPOS_ESCUELA = [
  { valor: 'COMUN', etiqueta: 'Común' },
  { valor: 'ESPECIAL', etiqueta: 'Especial' },
  { valor: 'HIBRIDA', etiqueta: 'Híbrida (común y especial)' },
]

export function nombreTipoEscuela(valor) {
  return TIPOS_ESCUELA.find((tipo) => tipo.valor === valor)?.etiqueta ?? ''
}

// Primera opción vacía para obligar a elegir. Si el perfil tiene un grado escrito
// a mano antes de este cambio, se suma como opción para no perderlo al editar.
export function opcionesSelector(opciones, valorActual = '', vacia = 'Elegí una opción') {
  const conActual =
    valorActual && !opciones.some((opcion) => opcion.valor === valorActual)
      ? [...opciones, { valor: valorActual, etiqueta: valorActual }]
      : opciones
  return [{ valor: '', etiqueta: vacia }, ...conActual]
}

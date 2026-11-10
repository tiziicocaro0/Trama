import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const RESALTE = ['ring-2', 'ring-primario', 'ring-offset-2', 'ring-offset-fondo']

// 4.5: al llegar desde la búsqueda (#aporte-<id>), lleva hasta ese aporte y lo resalta un momento.
// listo: true cuando la lista ya está en pantalla.
export default function useIrAlAporte(listo) {
  const { hash } = useLocation()

  useEffect(() => {
    if (!listo || !hash.startsWith('#aporte-')) return undefined
    const elemento = document.getElementById(hash.slice(1))
    if (!elemento) return undefined
    elemento.scrollIntoView?.({ block: 'center' })
    elemento.classList.add(...RESALTE)
    const quitar = setTimeout(() => elemento.classList.remove(...RESALTE), 2500)
    return () => {
      clearTimeout(quitar)
      elemento.classList.remove(...RESALTE)
    }
  }, [hash, listo])
}

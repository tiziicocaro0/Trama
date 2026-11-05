import { createContext, useContext } from 'react'

// El perfil del niño que carga PerfilLayout una sola vez para todas sus secciones.
const PerfilContext = createContext(null)

export function usePerfilDelLayout() {
  return useContext(PerfilContext)
}

export default PerfilContext

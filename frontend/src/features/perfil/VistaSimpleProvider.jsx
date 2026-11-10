import { useState } from 'react'
import VistaSimpleContext from './VistaSimpleContext.js'

const CLAVE_VISTA_SIMPLE = 'trama-vista-simple'

export default function VistaSimpleProvider({ children }) {
  const [vistaSimple, setVistaSimple] = useState(
    () => localStorage.getItem(CLAVE_VISTA_SIMPLE) === 'true',
  )

  function cambiarVistaSimple(valor) {
    setVistaSimple(valor)
    localStorage.setItem(CLAVE_VISTA_SIMPLE, String(valor))
  }

  return (
    <VistaSimpleContext.Provider
      value={{
        vistaSimple,
        setVistaSimple: cambiarVistaSimple,
      }}
    >
      {children}
    </VistaSimpleContext.Provider>
  )
}
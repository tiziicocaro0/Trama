import { useContext } from 'react'
import VistaSimpleContext from './VistaSimpleContext.js'

export default function useVistaSimple() {
  const contexto = useContext(VistaSimpleContext)

  if (!contexto) {
    throw new Error(
      'useVistaSimple debe usarse dentro de VistaSimpleProvider',
    )
  }

  return contexto
}
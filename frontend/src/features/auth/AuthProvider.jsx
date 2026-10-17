import { useCallback, useEffect, useRef, useState } from 'react'
import { iniciarSesion, obtenerIdentidad } from '../../api/auth.js'
import {
  alRechazarSesion,
  guardarToken,
  obtenerToken,
} from '../../api/cliente.js'
import AuthContext from './AuthContext.js'
import { vencimientoToken } from './sesion.js'

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [estado, setEstado] = useState(() =>
    obtenerToken() ? 'verificando' : 'anonimo',
  )
  const [mensajeSesion, setMensajeSesion] = useState('')
  const pendiente = useRef(null)

  const cerrarSesion = useCallback((mensaje = 'Cerraste tu sesión.') => {
    guardarToken(null)
    setUsuario(null)
    setEstado('anonimo')
    setMensajeSesion(mensaje)
  }, [])

  const confirmarSesion = useCallback(() => {
    const token = obtenerToken()
    if (!token || vencimientoToken(token) <= Date.now()) {
      cerrarSesion('Tu sesión venció. Ingresá nuevamente.')
      return Promise.reject(
        new Error('No hay una sesión vigente. Ingresá nuevamente.'),
      )
    }
    if (pendiente.current?.token === token) return pendiente.current.promesa
    const promesa = obtenerIdentidad()
      .then((identidad) => {
        if (obtenerToken() !== token) {
          throw new Error('La sesión cambió. Ingresá nuevamente.')
        }
        if (vencimientoToken(token) <= Date.now()) {
          cerrarSesion('Tu sesión venció. Ingresá nuevamente.')
          throw new Error('La sesión venció. Ingresá nuevamente.')
        }
        setUsuario(identidad)
        setEstado('autenticado')
        setMensajeSesion('')
        return identidad
      })
      .catch((error) => {
        if (obtenerToken() === token) {
          setEstado('sin-conexion')
          setMensajeSesion(
            'No pudimos verificar tu sesión. Revisá la conexión e intentá nuevamente.',
          )
        }
        throw error
      })
      .finally(() => {
        if (pendiente.current?.promesa === promesa) pendiente.current = null
      })
    pendiente.current = { token, promesa }
    return promesa
  }, [cerrarSesion])

  const ingresar = useCallback(
    async (credenciales) => {
      await iniciarSesion(credenciales)
      try {
        await confirmarSesion()
      } catch {
        throw new Error(
          'No pudimos verificar tu sesión. Intentá ingresar nuevamente.',
        )
      }
    },
    [confirmarSesion],
  )

  const reintentar = useCallback(async () => {
    setEstado('verificando')
    try {
      await confirmarSesion()
    } catch {
      setEstado(obtenerToken() ? 'sin-conexion' : 'anonimo')
      setMensajeSesion(
        'No pudimos verificar tu sesión. Revisá la conexión o ingresá nuevamente.',
      )
    }
  }, [confirmarSesion])

  useEffect(
    () =>
      alRechazarSesion(() =>
        cerrarSesion(
          'Tu sesión venció o dejó de ser válida. Ingresá nuevamente.',
        ),
      ),
    [cerrarSesion],
  )

  useEffect(() => {
    if (obtenerToken()) {
      void reintentar()
    }
  }, [reintentar])

  useEffect(() => {
    if (!usuario) return
    let timer
    function verificar() {
      clearTimeout(timer)
      const restante = vencimientoToken(obtenerToken() || '') - Date.now()
      if (restante <= 0) cerrarSesion('Tu sesión venció. Ingresá nuevamente.')
      else timer = setTimeout(verificar, Math.min(restante, 2147483647))
    }
    verificar()
    window.addEventListener('focus', verificar)
    document.addEventListener('visibilitychange', verificar)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', verificar)
      document.removeEventListener('visibilitychange', verificar)
    }
  }, [usuario, cerrarSesion])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        estado,
        mensajeSesion,
        ingresar,
        confirmarSesion,
        reintentar,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

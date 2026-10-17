import axios from 'axios'

let tokenEnMemoria = null
const observadores = new Set()

export function alRechazarSesion(observador) {
  observadores.add(observador)
  return () => observadores.delete(observador)
}

export function guardarToken(token) {
  tokenEnMemoria = token
}

export function obtenerToken() {
  return tokenEnMemoria
}

const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim(),
  timeout: 15000,
})

cliente.interceptors.request.use((config) => {
  if (
    tokenEnMemoria &&
    !['/auth/registro', '/auth/login'].includes(config.url)
  ) {
    config.headers.set('Authorization', `Bearer ${tokenEnMemoria}`)
  }
  return config
})

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const autorizacion = error.config?.headers?.get?.('Authorization')
    if (
      error.response?.status === 401 &&
      tokenEnMemoria &&
      autorizacion === `Bearer ${tokenEnMemoria}`
    ) {
      guardarToken(null)
      observadores.forEach((observador) => observador())
    }
    return Promise.reject(error)
  },
)

export default cliente

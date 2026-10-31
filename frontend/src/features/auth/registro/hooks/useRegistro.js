import { useRef, useState } from 'react'
import { registrarUsuario } from '../../../../api/auth.js'
import {
  ETAPA_CONFIRMACION,
  camposDatos,
  camposTipoCuenta,
  validarRegistro,
} from '../validaciones.js'
import useAuth from '../../../../hooks/useAuth.js'

export default function useRegistro() {
  const { confirmarSesion } = useAuth()
  const [valores, setValores] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    tipoCuenta: '',
    especialidades: [],
  })
  const [etapa, setEtapa] = useState(0)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const solicitudActiva = useRef(false)

  function cambiar(event) {
    const { name, value } = event.target
    if (solicitudActiva.current || exito) return
    setValores((actuales) => ({ ...actuales, [name]: value }))
    setErrores((actuales) => ({ ...actuales, [name]: undefined }))
    setMensaje('')
  }

  function alternarEspecialidad(valor) {
    if (solicitudActiva.current || exito) return
    setValores((actuales) => ({
      ...actuales,
      especialidades: actuales.especialidades.includes(valor)
        ? actuales.especialidades.filter((actual) => actual !== valor)
        : [...actuales.especialidades, valor],
    }))
    setErrores((actuales) => ({ ...actuales, especialidades: undefined }))
    setMensaje('')
  }

  function volver() {
    if (solicitudActiva.current || exito) return
    setEtapa((actual) => Math.max(0, actual - 1))
    setErrores({})
    setMensaje('')
  }

  async function avanzar(event) {
    event.preventDefault()
    if (solicitudActiva.current || exito) return
    const erroresActuales = validarRegistro(valores, etapa)
    setErrores(erroresActuales)
    setMensaje('')
    if (Object.keys(erroresActuales).length) {
      if (etapa === ETAPA_CONFIRMACION) setEtapa(etapaConError(erroresActuales))
      return
    }
    if (etapa < ETAPA_CONFIRMACION) {
      setEtapa(etapa + 1)
      return
    }

    solicitudActiva.current = true
    setEnviando(true)
    try {
      await registrarUsuario({
        ...valores,
        email: valores.email.trim().toLowerCase(),
        especialidades:
          valores.tipoCuenta === 'PROFESIONAL' ? valores.especialidades : [],
      })
      setValores((actuales) => ({ ...actuales, password: '' }))
      setExito(true)
      await confirmarSesion()
    } catch (error) {
      setMensaje(
        error.message ||
          'No pudimos completar el registro. Intentá nuevamente.',
      )
      setErrores(error.campos || {})
      if (error.campos && Object.keys(error.campos).length)
        setEtapa(etapaConError(error.campos))
    } finally {
      solicitudActiva.current = false
      setEnviando(false)
    }
  }

  return {
    valores,
    etapa,
    errores,
    mensaje,
    enviando,
    exito,
    cambiar,
    alternarEspecialidad,
    volver,
    avanzar,
  }
}

function etapaConError(errores) {
  if (camposDatos.some((campo) => errores[campo])) return 0
  if (camposTipoCuenta.some((campo) => errores[campo])) return 1
  return 2
}

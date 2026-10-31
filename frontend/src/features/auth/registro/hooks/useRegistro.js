import { useEffect, useRef, useState } from 'react'
import {
  reenviarVerificacion,
  registrarUsuario,
  verificarEmail,
} from '../../../../api/auth.js'
import {
  ETAPA_CODIGO,
  ETAPA_CONFIRMACION,
  camposDatos,
  camposTipoCuenta,
  validarRegistro,
} from '../validaciones.js'
import useAuth from '../../../../hooks/useAuth.js'

const SEGUNDOS_ENTRE_ENVIOS = 60

export default function useRegistro() {
  const { confirmarSesion } = useAuth()
  const [valores, setValores] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    tipoCuenta: '',
    area: '',
    especialidades: [],
    codigo: '',
  })
  const [etapa, setEtapa] = useState(0)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [segundosReenvio, setSegundosReenvio] = useState(0)
  const solicitudActiva = useRef(false)

  useEffect(() => {
    if (segundosReenvio <= 0) return undefined
    const id = setTimeout(() => setSegundosReenvio((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [segundosReenvio])

  function cambiar(event) {
    const { name, value } = event.target
    if (solicitudActiva.current || exito) return
    setValores((actuales) => ({
      ...actuales,
      [name]: name === 'codigo' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }))
    setErrores((actuales) => ({ ...actuales, [name]: undefined }))
    setMensaje('')
  }

  // 9.4: elegir tipo de cuenta o área; al cambiar cualquiera se vacían las especialidades.
  function elegir(campo, valor) {
    if (solicitudActiva.current || exito) return
    setValores((actuales) => ({
      ...actuales,
      [campo]: valor,
      ...(actuales[campo] !== valor
        ? { especialidades: [], ...(campo === 'tipoCuenta' ? { area: '' } : {}) }
        : {}),
    }))
    setErrores((actuales) => ({ ...actuales, [campo]: undefined, especialidades: undefined }))
    setMensaje('')
  }

  function cambiarEspecialidades(especialidades) {
    if (solicitudActiva.current || exito) return
    setValores((actuales) => ({ ...actuales, especialidades }))
    setErrores((actuales) => ({ ...actuales, especialidades: undefined }))
    setMensaje('')
  }

  function volver() {
    // Con la cuenta creada ya no se vuelve atrás: solo falta el código.
    if (solicitudActiva.current || exito || etapa === ETAPA_CODIGO) return
    setEtapa((actual) => Math.max(0, actual - 1))
    setErrores({})
    setMensaje('')
  }

  async function enviar(accion, alFallar) {
    solicitudActiva.current = true
    setEnviando(true)
    try {
      await accion()
    } catch (error) {
      setMensaje(error.message || 'No pudimos completar el registro. Intentá nuevamente.')
      alFallar?.(error)
    } finally {
      solicitudActiva.current = false
      setEnviando(false)
    }
  }

  async function avanzar(event) {
    event.preventDefault()
    if (solicitudActiva.current || exito) return
    const erroresActuales = validarRegistro(valores, etapa)
    setErrores(erroresActuales)
    setMensaje('')
    setAviso('')
    if (Object.keys(erroresActuales).length) {
      if (etapa === ETAPA_CONFIRMACION) setEtapa(etapaConError(erroresActuales))
      return
    }
    if (etapa < ETAPA_CONFIRMACION) {
      setEtapa(etapa + 1)
      return
    }
    const email = valores.email.trim().toLowerCase()

    if (etapa === ETAPA_CONFIRMACION) {
      await enviar(
        async () => {
          await registrarUsuario({
            ...valores,
            email,
            especialidades:
              valores.tipoCuenta === 'PROFESIONAL'
                ? valores.especialidades.map(({ especialidad, aclaracion }) => ({
                    especialidad,
                    aclaracion: aclaracion.trim() || null,
                  }))
                : [],
          })
          // Último paso: el código que llega por mail.
          setValores((actuales) => ({ ...actuales, password: '' }))
          setEtapa(ETAPA_CODIGO)
          setSegundosReenvio(SEGUNDOS_ENTRE_ENVIOS)
        },
        (error) => {
          setErrores(error.campos || {})
          if (error.campos && Object.keys(error.campos).length)
            setEtapa(etapaConError(error.campos))
        },
      )
      return
    }

    await enviar(async () => {
      await verificarEmail({ email, codigo: valores.codigo })
      setExito(true)
      await confirmarSesion()
    })
  }

  async function reenviar() {
    if (solicitudActiva.current || segundosReenvio > 0) return
    await enviar(async () => {
      await reenviarVerificacion(valores.email)
      setValores((actuales) => ({ ...actuales, codigo: '' }))
      setSegundosReenvio(SEGUNDOS_ENTRE_ENVIOS)
      setAviso('Te mandamos un código nuevo. El anterior ya no sirve.')
    })
  }

  return {
    valores,
    etapa,
    errores,
    mensaje,
    aviso,
    enviando,
    exito,
    segundosReenvio,
    cambiar,
    elegir,
    cambiarEspecialidades,
    volver,
    avanzar,
    reenviar,
  }
}

function etapaConError(errores) {
  if (camposDatos.some((campo) => errores[campo])) return 0
  if (camposTipoCuenta.some((campo) => errores[campo])) return 1
  return 2
}

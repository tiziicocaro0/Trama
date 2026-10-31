import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import CampoFecha from '../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import CasillaOvillo from '../../components/ui/CasillaOvillo.jsx'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { crearProyecto } from '../../api/proyectos.js'
import { calcularEdad } from '../perfil/perfil.js'

// Son los datos del niño, no de quien crea el acompañamiento.
const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre del niño', maxLength: 80 },
  { nombre: 'apellido', etiqueta: 'Apellido del niño', maxLength: 80 },
  {
    nombre: 'apodo',
    etiqueta: 'Apodo del niño (opcional)',
    maxLength: 40,
    opcional: true,
  },
  { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
  { nombre: 'escuela', etiqueta: 'Escuela a la que va', maxLength: 120 },
  { nombre: 'grado', etiqueta: 'Grado', maxLength: 30 },
]

export default function NuevoAcompanamientoPage() {
  const { cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const [valores, setValores] = useState({
    nombre: '',
    apellido: '',
    apodo: '',
    fechaNacimiento: '',
    escuela: '',
    grado: '',
    consentimiento: false,
  })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const pendiente = useRef(false)
  const alerta = useRef(null)
  const hoy = new Date()
  const fechaMaxima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  function cambiar(event) {
    const { name, value, checked, type } = event.target
    setValores((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function guardar(event) {
    event.preventDefault()
    if (pendiente.current) return
    const nuevosErrores = {}
    const datos = { ...valores }
    for (const campo of campos) {
      datos[campo.nombre] = valores[campo.nombre].trim()
      if (!campo.opcional && !datos[campo.nombre])
        nuevosErrores[campo.nombre] = 'Completá este dato.'
      else if (campo.maxLength && datos[campo.nombre].length > campo.maxLength)
        nuevosErrores[campo.nombre] = `Usá hasta ${campo.maxLength} caracteres.`
    }
    if (datos.fechaNacimiento && calcularEdad(datos.fechaNacimiento) === null)
      nuevosErrores.fechaNacimiento =
        'Ingresá una fecha válida que no sea futura.'
    if (!datos.consentimiento)
      nuevosErrores.consentimiento =
        'Necesitamos tu autorización para continuar.'
    setErrores(nuevosErrores)
    setMensaje('')
    if (Object.keys(nuevosErrores).length) {
      event.currentTarget
        .querySelector(`[name="${Object.keys(nuevosErrores)[0]}"]`)
        ?.focus()
      return
    }
    pendiente.current = true
    setEnviando(true)
    try {
      const proyecto = await crearProyecto(datos)
      navegar(`/proyectos/${proyecto.id}`)
    } catch (error) {
      setMensaje(error.message)
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      pendiente.current = false
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-nuevo-acompanamiento" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-nuevo-acompanamiento"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-h1 text-secundario sm:text-display">
            Nuevo acompañamiento
          </h1>
          <p className="mt-3 text-texto-suave">
            Creá un espacio para compartir con su red de apoyo. Vas a quedar
            como tutor administrador.
          </p>
          <form
            onSubmit={guardar}
            noValidate
            aria-label="Crear acompañamiento"
            aria-busy={enviando}
            className="mt-6 space-y-6 rounded-lg bg-superficie p-5 shadow-sm sm:p-8"
          >
            <h2 className="font-display text-h2 text-secundario">
              Datos del niño
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {campos.map((campo) => (
                <div key={campo.nombre}>
                  <p aria-hidden="true" className="mb-2 font-semibold">
                    {campo.etiqueta}
                  </p>
                  <CampoFormulario
                    id={`nuevo-${campo.nombre}`}
                    label={campo.etiqueta}
                    error={errores[campo.nombre]}
                  >
                    {campo.tipo === 'fecha' ? (
                      <CampoFecha
                        name={campo.nombre}
                        value={valores[campo.nombre]}
                        onChange={cambiar}
                        max={fechaMaxima}
                        disabled={enviando}
                        required
                      />
                    ) : (
                      <Campo
                        name={campo.nombre}
                        type="text"
                        maxLength={campo.maxLength}
                        value={valores[campo.nombre]}
                        onChange={cambiar}
                        required={!campo.opcional}
                        disabled={enviando}
                      />
                    )}
                  </CampoFormulario>
                </div>
              ))}
            </div>
            <div>
              <CasillaOvillo
                name="consentimiento"
                checked={valores.consentimiento}
                onChange={cambiar}
                required
                disabled={enviando}
                invalida={Boolean(errores.consentimiento)}
                describedBy={
                  errores.consentimiento ? 'error-consentimiento' : undefined
                }
              >
                Declaro ser madre, padre o tutor legal de este niño, o contar
                con su autorización, para crear este acompañamiento y
                compartir estos datos con su red de apoyo.
              </CasillaOvillo>
              {errores.consentimiento && (
                <p
                  id="error-consentimiento"
                  className="mt-2 text-sm text-error"
                >
                  {errores.consentimiento}
                </p>
              )}
            </div>
            {mensaje && (
              <p
                ref={alerta}
                tabIndex={-1}
                role="alert"
                className="rounded-sm border border-error p-3 text-error"
              >
                {mensaje}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Boton type="submit" disabled={enviando}>
                {enviando ? 'Creando acompañamiento…' : 'Crear acompañamiento'}
              </Boton>
              <Boton
                to="/acompanamientos"
                variant="secondary"
                disabled={enviando}
              >
                Volver a acompañamientos
              </Boton>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

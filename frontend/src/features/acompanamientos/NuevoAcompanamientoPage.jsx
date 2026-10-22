import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Boton from '../../components/ui/Boton.jsx'
import Campo from '../../components/ui/Campo.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { crearProyecto } from '../../api/proyectos.js'
import { calcularEdad } from '../perfil/perfil.js'

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre', maxLength: 80 },
  { nombre: 'apellido', etiqueta: 'Apellido', maxLength: 80 },
  {
    nombre: 'apodo',
    etiqueta: 'Apodo (opcional)',
    maxLength: 40,
    opcional: true,
  },
  { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', type: 'date' },
  { nombre: 'escuela', etiqueta: 'Escuela', maxLength: 120 },
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
                    <Campo
                      name={campo.nombre}
                      type={campo.type ?? 'text'}
                      maxLength={campo.maxLength}
                      max={campo.type === 'date' ? fechaMaxima : undefined}
                      value={valores[campo.nombre]}
                      onChange={cambiar}
                      required={!campo.opcional}
                      disabled={enviando}
                    />
                  </CampoFormulario>
                </div>
              ))}
            </div>
            <div>
              <label className="flex min-h-11 items-start gap-3 rounded-md p-2 focus-within:outline-2 focus-within:outline-primario">
                <input
                  name="consentimiento"
                  type="checkbox"
                  checked={valores.consentimiento}
                  onChange={cambiar}
                  required
                  disabled={enviando}
                  aria-invalid={Boolean(errores.consentimiento)}
                  aria-describedby={
                    errores.consentimiento ? 'error-consentimiento' : undefined
                  }
                  className="mt-1 size-5 shrink-0 accent-primario"
                />
                <span>
                  Confirmo que cuento con autorización para crear este
                  acompañamiento y compartir estos datos con su red de apoyo.
                </span>
              </label>
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

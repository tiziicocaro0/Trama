import { useState } from 'react'
import Boton from '../../components/ui/Boton.jsx'
import { actualizarMisDatos } from '../../api/cuenta.js'
import { avisar, avisarError } from '../../components/avisos/avisosFlotantes.js'

const CAMPOS = [
  { nombre: 'nombre', etiqueta: 'Nombre', autoComplete: 'given-name' },
  { nombre: 'apellido', etiqueta: 'Apellido', autoComplete: 'family-name' },
]
const MAXIMO = 80

function validar(valores) {
  const errores = {}
  for (const { nombre, etiqueta } of CAMPOS) {
    const valor = valores[nombre].trim()
    if (!valor) errores[nombre] = `Completá tu ${etiqueta.toLowerCase()}.`
    else if (valor.length > MAXIMO) errores[nombre] = `Usá hasta ${MAXIMO} caracteres.`
  }
  return errores
}

// Mi perfil: corregir nombre y apellido. Al guardar devuelve los datos actualizados.
export default function FormularioMisDatos({ cuenta, onGuardado, onCancelar }) {
  const [valores, setValores] = useState({
    nombre: cuenta?.nombre ?? '',
    apellido: cuenta?.apellido ?? '',
  })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  async function guardar(evento) {
    evento.preventDefault()
    const encontrados = validar(valores)
    setErrores(encontrados)
    if (Object.keys(encontrados).length) return
    setGuardando(true)
    try {
      const actualizada = await actualizarMisDatos(valores)
      avisar('Guardamos tus datos.')
      onGuardado(actualizada)
    } catch (falla) {
      avisarError(falla?.response?.data?.mensaje || 'No pudimos guardar tus datos. Intentá nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate aria-label="Editar mis datos" className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {CAMPOS.map(({ nombre, etiqueta, autoComplete }) => (
          <div key={nombre}>
            <label htmlFor={`mis-datos-${nombre}`} className="font-semibold text-secundario">
              {etiqueta}
            </label>
            <input
              id={`mis-datos-${nombre}`}
              name={nombre}
              value={valores[nombre]}
              onChange={(evento) => setValores((actuales) => ({ ...actuales, [nombre]: evento.target.value }))}
              autoComplete={autoComplete}
              maxLength={MAXIMO}
              disabled={guardando}
              aria-invalid={Boolean(errores[nombre])}
              aria-describedby={errores[nombre] ? `mis-datos-${nombre}-error` : undefined}
              className={`mt-2 min-h-12 w-full rounded-md border bg-superficie px-4 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${errores[nombre] ? 'border-error' : 'border-borde'}`}
            />
            {errores[nombre] && (
              <p id={`mis-datos-${nombre}-error`} className="mt-2 text-sm text-error">
                {errores[nombre]}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-texto-suave">
        El email no se puede cambiar: es con el que ingresás a TRAMA.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Boton type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Boton>
        <Boton variant="secondary" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'

const OPCIONES_ROL = [
  { valor: 'FAMILIAR', etiqueta: 'Familiar' },
  { valor: 'EDUCACION', etiqueta: 'Educación' },
  { valor: 'SALUD', etiqueta: 'Salud' },
  { valor: 'TUTOR', etiqueta: 'Co-tutor (otro tutor legal)' },
]

export default function ModalInvitarMiembro({
  abierto,
  onCerrar,
  onInvitar,
}) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('FAMILIAR')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  function cerrarModal() {
    if (enviando) return
    setError('')
    onCerrar()
  }

  async function manejarSubmit(evento) {
    evento.preventDefault()
    if (!email.trim()) {
      setError('Ingresá el correo electrónico de la persona a invitar.')
      return
    }
    setEnviando(true)
    setError('')
    try {
      await onInvitar({ email: email.trim(), rol })
      setEmail('')
      setRol('FAMILIAR')
      onCerrar()
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          'No pudimos enviar la invitación. Intentá nuevamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Invitar a la red"
      onCerrar={cerrarModal}
    >
      <form onSubmit={manejarSubmit} className="space-y-4" noValidate>
        {error && <Aviso tipo="error">{error}</Aviso>}

        <div>
          <label
            htmlFor="email-invitacion"
            className="mb-1 block text-sm font-semibold text-texto"
          >
            Correo electrónico
          </label>
          <Campo
            id="email-invitacion"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            disabled={enviando}
            required
          />
        </div>

        <div>
          <label
            htmlFor="rol-invitacion"
            className="mb-1 block text-sm font-semibold text-texto"
          >
            Rol
          </label>
          <select
            id="rol-invitacion"
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            disabled={enviando}
            className="min-h-12 w-full rounded-md border border-borde bg-superficie px-4 py-2 text-base text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          >
            {OPCIONES_ROL.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Boton
            type="button"
            variante="fantasma"
            onClick={cerrarModal}
            disabled={enviando}
          >
            Cancelar
          </Boton>
          <Boton type="submit" disabled={enviando}>
            Enviar invitación
          </Boton>
        </div>
      </form>
    </Modal>
  )
}


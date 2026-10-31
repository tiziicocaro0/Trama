import { useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import { Envelope, UsersThree } from '@phosphor-icons/react'
import Campo from '../../../components/ui/Campo.jsx'
import CampoSelector from '../../../components/ui/CampoSelector.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'

const OPCIONES_ROL = [
  {
    valor: 'FAMILIAR',
    etiqueta: 'Familiar',
    ayuda: 'Abuelos, tíos u otros familiares que lo acompañan.',
  },
  {
    valor: 'EDUCACION',
    etiqueta: 'Educación',
    ayuda: 'Docentes y equipo de la escuela.',
  },
  {
    valor: 'SALUD',
    etiqueta: 'Salud',
    ayuda: 'Profesionales de la salud que lo tratan.',
  },
  {
    valor: 'TUTOR',
    etiqueta: 'Co-tutor (otro tutor legal)',
    ayuda: 'Otra madre, padre o tutor legal: también administra la red.',
  },
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
            icon={Envelope}
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
          <CampoSelector
            id="rol-invitacion"
            icon={UsersThree}
            opciones={OPCIONES_ROL}
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            disabled={enviando}
            aria-describedby="rol-invitacion-ayuda"
          />
          <p id="rol-invitacion-ayuda" className="mt-2 text-sm text-texto-suave">
            {OPCIONES_ROL.find((opcion) => opcion.valor === rol)?.ayuda}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Boton
            type="button"
            variant="secondary"
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


import { useContext, useState } from 'react'
import { CheckCircle, HandsClapping } from '@phosphor-icons/react'
import AuthContext from '../../auth/AuthContext.js'
import { confirmarAporte, quitarConfirmacion } from '../../../api/aportes.js'

// 3.3: confirmar un aporte de otra persona. En estrategias dice "A mí también me funcionó";
// en el resto, "Yo también lo observé". El aporte original no cambia: solo suma quién lo confirmó.
export default function ConfirmacionAporte({ aporte }) {
  // Sin sesión (por ejemplo, la tarjeta suelta en un test) no se ofrece confirmar.
  const usuario = useContext(AuthContext)?.usuario ?? null
  const [estado, setEstado] = useState(() => ({
    yoConfirme: Boolean(aporte.yoConfirme),
    confirmadoPor: Array.isArray(aporte.confirmadoPor) ? aporte.confirmadoPor : [],
  }))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const esPropio = Boolean(usuario?.id) && aporte.autorId === usuario.id
  const puedeConfirmar =
    Boolean(usuario?.id) && !esPropio && !aporte.archivado && Boolean(aporte.proyectoId)
  const texto =
    aporte.tipo === 'ESTRATEGIA' ? 'A mí también me funcionó' : 'Yo también lo observé'
  const nombreUsuario = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ')
  const cantidad = estado.confirmadoPor.length

  async function alternar() {
    if (enviando) return
    setEnviando(true)
    setError('')
    const confirmar = !estado.yoConfirme
    try {
      if (confirmar) await confirmarAporte(aporte.proyectoId, aporte.id)
      else await quitarConfirmacion(aporte.proyectoId, aporte.id)
      setEstado((actual) => ({
        yoConfirme: confirmar,
        confirmadoPor: confirmar
          ? [...actual.confirmadoPor, nombreUsuario || 'Vos']
          : actual.confirmadoPor.filter((nombre) => nombre !== nombreUsuario),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!puedeConfirmar && cantidad === 0) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {puedeConfirmar && (
          <button
            type="button"
            onClick={alternar}
            disabled={enviando}
            aria-pressed={estado.yoConfirme}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-wait ${estado.yoConfirme ? 'border-primario bg-decoracion text-primario' : 'border-borde text-secundario hover:bg-decoracion'}`}
          >
            {estado.yoConfirme ? (
              <CheckCircle size={18} weight="fill" aria-hidden="true" />
            ) : (
              <HandsClapping size={18} aria-hidden="true" />
            )}
            {texto}
          </button>
        )}
        {cantidad > 0 && (
          <p className="text-xs text-texto-suave">
            {cantidad === 1 ? 'Lo confirmó' : `Lo confirmaron ${cantidad} personas`}
            {': '}
            {estado.confirmadoPor.join(', ')}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

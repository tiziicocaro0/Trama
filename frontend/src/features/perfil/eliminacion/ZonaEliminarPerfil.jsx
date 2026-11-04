import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import { programarEliminacion } from '../../../api/proyectos.js'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import AvisoEliminacion from './AvisoEliminacion.jsx'
import { coincideNombre, mensajeDeError } from './eliminacion.js'

// 8.2: zona para que el tutor administrador elimine el perfil del niño.
// No borra en el momento: programa el borrado a 7 días, y para confirmarlo hay que escribir el nombre.
export default function ZonaEliminarPerfil({ proyecto }) {
  const [actual, setActual] = useState(proyecto)
  const [confirmando, setConfirmando] = useState(false)
  const [escrito, setEscrito] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const puedeConfirmar = coincideNombre(escrito, actual.nombre)

  function cerrar() {
    if (enviando) return
    setConfirmando(false)
    setEscrito('')
    setError('')
  }

  async function confirmar(evento) {
    evento.preventDefault()
    if (!puedeConfirmar || enviando) return
    setEnviando(true)
    setError('')
    try {
      setActual(await programarEliminacion(actual.id))
      setConfirmando(false)
      setEscrito('')
    } catch (problema) {
      setError(mensajeDeError(problema, 'No pudimos programar la eliminación. Intentá nuevamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-eliminar-perfil" className="mt-10 rounded-lg border border-error/40 bg-superficie p-5 shadow-sm sm:p-8">
      <h2 id="titulo-eliminar-perfil" className="font-display text-h2 text-error">
        Eliminar perfil
      </h2>
      {actual.eliminacionProgramada ? (
        <div className="mt-4">
          <AvisoEliminacion proyecto={actual} esAdmin onCancelada={setActual} />
        </div>
      ) : (
        <>
          <p className="mt-2 text-texto-suave">
            Borra el perfil de {actual.nombre} con todo lo que cargó la red: aportes, notas, bitácora,
            calendario y archivos. Tenés 7 días para arrepentirte; después no se puede recuperar.
            Toda la red recibe un aviso.
          </p>
          <Boton variant="danger" onClick={() => setConfirmando(true)} className="mt-4">
            <Trash size={18} aria-hidden="true" />
            Eliminar perfil
          </Boton>
        </>
      )}

      <Modal abierto={confirmando} titulo="Eliminar perfil" onCerrar={cerrar}>
        <form onSubmit={confirmar} noValidate className="space-y-4">
          <p>
            El perfil se borra en 7 días. Para confirmar, escribí el nombre del niño:{' '}
            <strong>{actual.nombre}</strong>
          </p>
          <div>
            <label htmlFor="confirmar-nombre" className="mb-2 block font-semibold">
              Nombre del niño
            </label>
            <Campo
              id="confirmar-nombre"
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              autoComplete="off"
              disabled={enviando}
            />
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-error">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Boton type="button" variant="secondary" onClick={cerrar} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton type="submit" variant="danger" disabled={!puedeConfirmar || enviando}>
              {enviando ? 'Programando…' : 'Eliminar en 7 días'}
            </Boton>
          </div>
        </form>
      </Modal>
    </section>
  )
}

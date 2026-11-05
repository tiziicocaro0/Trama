import { useState } from 'react'
import { IdentificationCard, Plus } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton.jsx'
import InfoAyuda from '../../components/ui/InfoAyuda.jsx'
import { actualizarMatricula, quitarComprobanteMatricula } from '../../api/cuenta.js'
import MatriculaMiembro from '../perfil/components/MatriculaMiembro.jsx'
import { AVISO_MATRICULA } from '../perfil/matricula.js'
import ModalMatricula from './ModalMatricula.jsx'
import { avisar, avisarError } from '../../components/avisos/avisosFlotantes.js'

// Mi perfil: el profesional suma, cambia o quita su matrícula y su comprobante.
export default function SeccionMatricula({ usuario, onCambio }) {
  const [cuenta, setCuenta] = useState({
    matricula: usuario?.matricula ?? null,
    tieneComprobanteMatricula: Boolean(usuario?.tieneComprobanteMatricula),
  })
  const [modalAbierto, setModalAbierto] = useState(false)
  const [quitando, setQuitando] = useState(false)

  function actualizar(nueva, texto) {
    setCuenta({
      matricula: nueva?.matricula ?? null,
      tieneComprobanteMatricula: Boolean(nueva?.tieneComprobanteMatricula),
    })
    avisar(texto)
    onCambio?.()
  }

  async function quitar(accion, texto) {
    setQuitando(true)
    try {
      actualizar(await accion(), texto)
    } catch {
      avisarError('No pudimos guardar el cambio. Intentá nuevamente.')
    } finally {
      setQuitando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-matricula" className="rounded-lg bg-superficie p-6 shadow-sm">
      <h2 id="titulo-matricula" className="mb-2 flex items-center gap-2 font-display text-h2 text-secundario">
        <IdentificationCard size={24} aria-hidden="true" />
        Matrícula
        <InfoAyuda etiqueta="Sobre la matrícula">{AVISO_MATRICULA}</InfoAyuda>
      </h2>
      {cuenta.matricula ? (
        <>
          <MatriculaMiembro
            usuarioId={usuario?.id}
            matricula={cuenta.matricula}
            tieneComprobante={cuenta.tieneComprobanteMatricula}
            conAviso={false}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Boton variant="secondary" onClick={() => setModalAbierto(true)} disabled={quitando}>
              Cambiar matrícula
            </Boton>
            {cuenta.tieneComprobanteMatricula && (
              <Boton
                variant="secondary"
                onClick={() => quitar(quitarComprobanteMatricula, 'Quitamos el comprobante.')}
                disabled={quitando}
              >
                Quitar comprobante
              </Boton>
            )}
            <Boton
              variant="danger"
              onClick={() => quitar(() => actualizarMatricula(''), 'Quitamos tu matrícula.')}
              disabled={quitando}
            >
              Quitar matrícula
            </Boton>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-texto-suave">
            Es opcional. La ve la red de cada niño en el que participás.
          </p>
          <Boton onClick={() => setModalAbierto(true)}>
            <Plus size={20} aria-hidden="true" />
            Sumar matrícula
          </Boton>
        </>
      )}
      {modalAbierto && (
        <ModalMatricula
          matriculaActual={cuenta.matricula ?? ''}
          tieneComprobante={cuenta.tieneComprobanteMatricula}
          onCerrar={() => setModalAbierto(false)}
          onGuardada={(nueva) => {
            setModalAbierto(false)
            actualizar(nueva, 'Guardamos tu matrícula.')
          }}
        />
      )}
    </section>
  )
}

import { useId, useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import { Tarjeta } from '../../../components/ui/Tarjeta.jsx'
import { asociarProfesional, quitarProfesional } from '../../../api/instituciones.js'
import { formatearPesos } from '../../plan/planes.js'
import AvisoCambioPaquete from './AvisoCambioPaquete.jsx'

function uso(usados, cupo) {
  return cupo === null || cupo === undefined ? `${usados} (sin límite)` : `${usados} de ${cupo}`
}

// 9.2: paquete actual, cupos usados y profesionales asociados. Sin datos de los niños.
export default function PanelInstitucion({ institucion, onActualizar }) {
  const campoId = useId()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const { paquete } = institucion

  async function ejecutar(accion, exito) {
    setEnviando(true)
    setError('')
    setMensaje('')
    try {
      onActualizar(await accion())
      setMensaje(exito)
      return true
    } catch (problema) {
      setError(problema.message)
      return false
    } finally {
      setEnviando(false)
    }
  }

  async function asociar(evento) {
    evento.preventDefault()
    if (!email.trim()) {
      setError('Ingresá el email del profesional.')
      return
    }
    if (await ejecutar(() => asociarProfesional(email), 'Profesional asociado.')) setEmail('')
  }

  return (
    <div className="space-y-6">
      <Tarjeta titulo={`${institucion.nombre} · Paquete ${paquete.nombre}`}>
        <p className="text-texto-suave">{formatearPesos(paquete.precioArs)} por mes (pago de prueba)</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-decoracion/60 p-4">
            <dt className="text-sm text-texto-suave">Niños cubiertos</dt>
            <dd className="text-subtitulo font-bold">{uso(institucion.ninosUsados, paquete.cupoNinos)}</dd>
          </div>
          <div className="rounded-md bg-decoracion/60 p-4">
            <dt className="text-sm text-texto-suave">Profesionales</dt>
            <dd className="text-subtitulo font-bold">
              {uso(institucion.profesionalesUsados, paquete.cupoProfesionales)}
            </dd>
          </div>
        </dl>
      </Tarjeta>
      <Aviso>
        Como responsable no ves los perfiles de los niños: solo cuántos cubre el
        paquete.
      </Aviso>
      <section aria-labelledby="titulo-profesionales" className="space-y-4">
        <h2 id="titulo-profesionales" className="font-display text-h2 text-secundario">
          Profesionales asociados
        </h2>
        <form onSubmit={asociar} className="space-y-2" noValidate>
          <label htmlFor={campoId} className="font-semibold">
            Email del profesional
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Campo
                id={campoId}
                type="email"
                value={email}
                maxLength={254}
                onChange={(evento) => setEmail(evento.target.value)}
                disabled={enviando}
              />
            </div>
            <Boton type="submit" disabled={enviando}>
              Asociar
            </Boton>
          </div>
        </form>
        {error && <p role="alert" className="text-error">{error}</p>}
        {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
        {institucion.profesionales.length === 0 ? (
          <p className="text-texto-suave">Todavía no asociaste profesionales.</p>
        ) : (
          <ul className="divide-y divide-borde rounded-lg border border-borde bg-superficie">
            {institucion.profesionales.map((profesional) => (
              <li
                key={profesional.licenciaId}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {profesional.nombre} {profesional.apellido}
                  </p>
                  <p className="text-sm text-texto-suave">{profesional.email}</p>
                </div>
                <Boton
                  variant="secondary"
                  disabled={enviando}
                  aria-label={`Quitar a ${profesional.nombre} ${profesional.apellido}`}
                  onClick={() =>
                    ejecutar(() => quitarProfesional(profesional.licenciaId), 'Profesional quitado.')
                  }
                >
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </section>
      {institucion.aviso && (
        <AvisoCambioPaquete
          aviso={institucion.aviso}
          paqueteActual={paquete.nombre}
          onCerrado={onActualizar}
        />
      )}
    </div>
  )
}

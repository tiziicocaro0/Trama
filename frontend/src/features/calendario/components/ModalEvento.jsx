import { Clock } from '@phosphor-icons/react'
import { useState } from 'react'
import { Aviso } from '../../../components/ui/Aviso.jsx'
import Boton from '../../../components/ui/Boton.jsx'
import Campo from '../../../components/ui/Campo.jsx'
import CampoFecha from '../../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../../components/ui/CampoFormulario.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import SubirArchivo from '../../../components/ui/SubirArchivo.jsx'
import { hoyIso } from '../../../utils/fechas.js'

function normalizarHora(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return ''
  return valor.trim().slice(0, 5)
}

function archivosIniciales(evento) {
  if (!evento?.imagenId) return []
  return [
    {
      id: evento.imagenId,
      nombreOriginal: evento.imagenNombre || 'Imagen del evento',
      tipoMime: 'image/png',
    },
  ]
}

function FormularioEvento({
  proyectoId,
  evento,
  fechaPorDefecto,
  onCerrar,
  onGuardar,
}) {
  const esEdicion = Boolean(evento?.id)
  const [titulo, setTitulo] = useState(evento?.titulo ?? '')
  const [fecha, setFecha] = useState(
    evento?.fecha ?? fechaPorDefecto ?? hoyIso(),
  )
  const [horaInicio, setHoraInicio] = useState(
    normalizarHora(evento?.horaInicio) || '09:00',
  )
  const [horaFin, setHoraFin] = useState(
    normalizarHora(evento?.horaFin) || '10:00',
  )
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? '')
  const [archivos, setArchivos] = useState(() => archivosIniciales(evento))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  function manejarArchivos(lista) {
    setArchivos(Array.isArray(lista) ? lista.slice(-1) : [])
  }

  async function manejarSubmit(e) {
    e.preventDefault()
    if (enviando) return

    const tituloLimpio = titulo.trim()
    if (!tituloLimpio || tituloLimpio.length > 150) {
      setError('Ingresá un título de hasta 150 caracteres.')
      return
    }
    if (!fecha) {
      setError('Seleccioná la fecha del evento.')
      return
    }
    const inicio = normalizarHora(horaInicio)
    const fin = normalizarHora(horaFin)
    if (!inicio || !fin) {
      setError('Indicá la hora de inicio y la hora de fin.')
      return
    }
    if (fin <= inicio) {
      setError('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    if (descripcion.length > 4000) {
      setError('La descripción no puede superar los 4000 caracteres.')
      return
    }

    setEnviando(true)
    setError('')
    try {
      await onGuardar({
        titulo: tituloLimpio,
        fecha,
        horaInicio: inicio,
        horaFin: fin,
        descripcion: descripcion.trim(),
        imagenId: archivos[0]?.id ?? null,
      })
      onCerrar()
    } catch (err) {
      setError(
        err?.message ||
          'No pudimos guardar el evento. Revisá los datos e intentá nuevamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      onSubmit={manejarSubmit}
      noValidate
      aria-label={esEdicion ? 'Editar evento' : 'Nuevo evento'}
      className="space-y-4"
    >
      {error && <Aviso tipo="error">{error}</Aviso>}

      <CampoFormulario
        id="evento-titulo"
        label="Título"
        hint="Obligatorio, hasta 150 caracteres"
      >
        <Campo
          name="titulo"
          placeholder="Ej. Acto escolar, turno con fonoaudiología…"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={150}
          disabled={enviando}
          required
        />
      </CampoFormulario>

      <CampoFormulario id="evento-fecha" label="Fecha">
        <CampoFecha
          name="fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          disabled={enviando}
          required
        />
      </CampoFormulario>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoFormulario id="evento-hora-inicio" label="Hora de inicio">
          <Campo
            type="time"
            name="horaInicio"
            icon={Clock}
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            disabled={enviando}
            required
          />
        </CampoFormulario>

        <CampoFormulario id="evento-hora-fin" label="Hora de fin">
          <Campo
            type="time"
            name="horaFin"
            icon={Clock}
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            disabled={enviando}
            required
          />
        </CampoFormulario>
      </div>

      <div>
        <label
          htmlFor="evento-descripcion"
          className="mb-1.5 block font-semibold text-texto"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="evento-descripcion"
          name="descripcion"
          rows={3}
          maxLength={4000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={enviando}
          placeholder="Sumá detalles útiles para anticipar el evento…"
          className="w-full rounded-md border border-borde bg-superficie p-3 text-texto placeholder:text-texto-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
        />
      </div>

      <SubirArchivo
        proyectoId={proyectoId}
        archivos={archivos}
        onChange={manejarArchivos}
        disabled={enviando}
      />

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Boton
          type="button"
          variant="secondary"
          onClick={onCerrar}
          disabled={enviando}
        >
          Cancelar
        </Boton>
        <Boton type="submit" disabled={enviando}>
          {enviando
            ? 'Guardando…'
            : esEdicion
              ? 'Guardar cambios'
              : 'Crear evento'}
        </Boton>
      </div>
    </form>
  )
}

export default function ModalEvento({
  abierto,
  proyectoId,
  evento = null,
  fechaPorDefecto,
  onCerrar,
  onGuardar,
}) {
  const esEdicion = Boolean(evento?.id)
  const claveFormulario = `${abierto ? 'abierto' : 'cerrado'}-${evento?.id ?? 'nuevo'}`

  return (
    <Modal
      abierto={abierto}
      titulo={esEdicion ? 'Editar evento' : 'Nuevo evento'}
      onCerrar={onCerrar}
    >
      <FormularioEvento
        key={claveFormulario}
        proyectoId={proyectoId}
        evento={evento}
        fechaPorDefecto={fechaPorDefecto}
        onCerrar={onCerrar}
        onGuardar={onGuardar}
      />
    </Modal>
  )
}


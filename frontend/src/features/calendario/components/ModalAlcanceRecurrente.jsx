import Boton from '../../../components/ui/Boton.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import { formatearFechaCalendario } from '../../../utils/fechas.js'

export default function ModalAlcanceRecurrente({
  abierto,
  accion = 'editar',
  evento = null,
  procesando = false,
  onCerrar,
  onElegir,
}) {
  const esEliminar = accion === 'eliminar'
  const fechaVisible = evento?.fechaOcurrencia || evento?.fecha || ''
  const fechaFormateada =
    formatearFechaCalendario(fechaVisible) || fechaVisible

  return (
    <Modal
      abierto={abierto}
      titulo="¿Solo este o toda la serie?"
      onCerrar={onCerrar}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-texto">
          {esEliminar
            ? `Estás por eliminar "${evento?.titulo ?? ''}"${fechaFormateada ? ` (${fechaFormateada})` : ''}. ¿Querés borrar solo esta fecha o todas las semanas?`
            : `Estás por editar "${evento?.titulo ?? ''}"${fechaFormateada ? ` (${fechaFormateada})` : ''}. ¿Querés aplicar los cambios solo a este encuentro o a toda la serie?`}
        </p>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Boton
            type="button"
            variant="secondary"
            onClick={onCerrar}
            disabled={procesando}
          >
            Cancelar
          </Boton>
          <Boton
            type="button"
            variant="secondary"
            onClick={() => onElegir('ocurrencia')}
            disabled={procesando}
          >
            Solo este
          </Boton>
          <Boton
            type="button"
            variant={esEliminar ? 'danger' : 'primary'}
            onClick={() => onElegir('serie')}
            disabled={procesando}
          >
            Toda la serie
          </Boton>
        </div>
      </div>
    </Modal>
  )
}


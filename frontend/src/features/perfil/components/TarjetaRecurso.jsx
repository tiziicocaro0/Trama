import { FilePdf } from '@phosphor-icons/react'
import { obtenerVistaImagen } from '../../../api/archivos.js'
import useImagenRemota from '../../../hooks/useImagenRemota.js'
import FotoUsuario from '../../cuenta/FotoUsuario.jsx'
import { ICONOS_APORTE, ICONO_RECURSO } from '../iconosAporte.js'
import { dondeSeCargo, esImagen } from '../recursos.js'

export function IconoOrigen({ recurso, ...props }) {
  const Icono =
    recurso.origen === 'APORTE' ? (ICONOS_APORTE[recurso.tipoAporte] ?? ICONO_RECURSO) : ICONO_RECURSO
  return <Icono {...props} />
}

// Miniatura de la galería: la foto (o el ícono del PDF) y, abajo a la derecha,
// dónde se cargó y quién lo subió.
export default function TarjetaRecurso({ proyectoId, recurso, onAbrir }) {
  const imagen = esImagen(recurso)
  const url = useImagenRemota(imagen ? `${proyectoId}:${recurso.archivoId}` : null, () =>
    obtenerVistaImagen(proyectoId, recurso.archivoId),
  )
  const donde = dondeSeCargo(recurso)

  return (
    <button
      type="button"
      onClick={() => onAbrir(recurso)}
      aria-label={`${recurso.nombreOriginal}. Cargado en ${donde} por ${recurso.autorNombre}`}
      className="group w-full overflow-hidden rounded-lg bg-superficie text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario motion-reduce:transition-none"
    >
      <span className="relative block aspect-square bg-decoracion">
        {imagen && url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center p-4 text-primario">
            <FilePdf size={56} weight="light" aria-hidden="true" />
          </span>
        )}

        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-superficie p-1 shadow-sm">
          <span
            title={donde}
            className="flex size-8 items-center justify-center rounded-full bg-decoracion text-secundario"
          >
            <IconoOrigen recurso={recurso} size={18} aria-hidden="true" />
          </span>
          <span title={recurso.autorNombre} aria-hidden="true">
            <FotoUsuario
              usuarioId={recurso.autorId}
              tieneFoto={recurso.autorTieneFoto}
              nombre={recurso.autorNombre}
              className="size-8"
              tamanoIcono={16}
            />
          </span>
        </span>
      </span>

      <span className="block truncate px-3 py-2 text-sm font-semibold text-texto">
        {recurso.nombreOriginal}
      </span>
    </button>
  )
}

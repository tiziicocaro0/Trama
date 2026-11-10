import { DownloadSimple, FilePdf } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { archivarRecurso, descargarArchivo, obtenerVistaImagen } from '../../../api/archivos.js'
import { avisar, avisarError } from '../../../components/avisos/avisosFlotantes.js'
import Boton from '../../../components/ui/Boton.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import useImagenRemota from '../../../hooks/useImagenRemota.js'
import FotoUsuario from '../../cuenta/FotoUsuario.jsx'
import { seccionDesregulacion, seccionesPerfil, seccionNotas } from '../perfil.js'
import { dondeSeCargo, esImagen, formatearSubida } from '../recursos.js'
import { IconoOrigen } from './TarjetaRecurso.jsx'

// Ruta de la sección del perfil donde está el aporte (la bitácora para observaciones y ABC)
function rutaDeLaSeccion(proyectoId, tipo) {
  if (tipo === 'OBSERVACION' || tipo === 'ABC') return `/proyectos/${proyectoId}/bitacora`
  const seccion = [...seccionesPerfil, seccionDesregulacion, seccionNotas].find((item) => item.tipo === tipo)
  return seccion ? `/proyectos/${proyectoId}/${seccion.slug}` : null
}

// El recurso en grande, con quién lo subió, dónde y cuándo
export default function VisorRecurso({ proyectoId, recurso, onCerrar, onArchivado }) {
  const imagen = esImagen(recurso)
  const url = useImagenRemota(imagen ? `${proyectoId}:${recurso.archivoId}:grande` : null, () =>
    obtenerVistaImagen(proyectoId, recurso.archivoId),
  )
  const [confirmando, setConfirmando] = useState(false)
  const [archivando, setArchivando] = useState(false)
  const rutaSeccion = recurso.origen === 'APORTE' ? rutaDeLaSeccion(proyectoId, recurso.tipoAporte) : null

  async function descargar() {
    try {
      await descargarArchivo(proyectoId, recurso.archivoId, recurso.nombreOriginal)
    } catch (error) {
      avisarError(error.message)
    }
  }

  async function archivar() {
    setArchivando(true)
    try {
      await archivarRecurso(proyectoId, recurso.archivoId)
      avisar('Listo. Archivamos el recurso.')
      onArchivado()
    } catch {
      avisarError('No pudimos archivar el recurso. Intentá nuevamente.')
      setArchivando(false)
    }
  }

  return (
    <Modal abierto titulo={recurso.nombreOriginal} onCerrar={onCerrar} cerrarAlTocarFuera ancho="max-w-3xl">
      <div className="space-y-5">
        {imagen ? (
          url ? (
            <img src={url} alt={recurso.nombreOriginal} className="w-full rounded-lg bg-decoracion object-contain" />
          ) : (
            <p role="status" className="text-texto-suave">Cargando la imagen…</p>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-decoracion p-8 text-primario">
            <FilePdf size={64} weight="light" aria-hidden="true" />
            <p className="text-center text-texto">Los PDF se abren al descargarlos.</p>
          </div>
        )}

        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-texto-suave">Subido por</dt>
            <dd className="mt-1 flex items-center gap-2 font-semibold text-texto">
              <FotoUsuario
                usuarioId={recurso.autorId}
                tieneFoto={recurso.autorTieneFoto}
                nombre={recurso.autorNombre}
                className="size-8"
                tamanoIcono={16}
              />
              {recurso.autorNombre}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-texto-suave">Fecha y hora</dt>
            <dd className="mt-1 text-texto">{formatearSubida(recurso.fecha)}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-texto-suave">Dónde se cargó</dt>
            <dd className="mt-1 flex items-center gap-2 text-texto">
              <IconoOrigen recurso={recurso} size={20} aria-hidden="true" className="shrink-0 text-secundario" />
              {rutaSeccion ? (
                <Link to={rutaSeccion} className="font-semibold text-primario underline underline-offset-4">
                  {dondeSeCargo(recurso)}
                </Link>
              ) : (
                dondeSeCargo(recurso)
              )}
            </dd>
            {recurso.aporteTitulo && <dd className="mt-1 text-sm text-texto-suave">{recurso.aporteTitulo}</dd>}
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Boton onClick={descargar}>
            <DownloadSimple size={20} aria-hidden="true" />
            Descargar
          </Boton>
          {recurso.puedeArchivar &&
            (confirmando ? (
              <>
                <Boton variant="danger" onClick={archivar} disabled={archivando}>
                  {archivando ? 'Archivando…' : 'Sí, archivar'}
                </Boton>
                <Boton variant="secondary" onClick={() => setConfirmando(false)} disabled={archivando}>
                  Cancelar
                </Boton>
              </>
            ) : (
              <Boton variant="secondary" onClick={() => setConfirmando(true)}>
                Archivar
              </Boton>
            ))}
        </div>
        {confirmando && (
          <p className="text-sm text-texto-suave">
            El recurso deja de verse en la galería, pero no se borra: queda guardado como los aportes archivados.
          </p>
        )}
      </div>
    </Modal>
  )
}

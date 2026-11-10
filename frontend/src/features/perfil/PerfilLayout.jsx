import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import Boton from '../../components/ui/Boton.jsx'
import useProyectoActual from '../../hooks/useProyectoActual.js'
import { obtenerProyecto } from '../../api/proyectos.js'
import CabeceraPerfil from './components/CabeceraPerfil.jsx'
import PerfilContext from './PerfilContext.js'
import { seccionesPerfil, seccionDesregulacion, } from './perfil.js'

const ESPACIOS = {
  red: 'Red',
  'datos-personales': 'Datos personales',
  recursos: 'Recursos',
  buscar: 'Buscar en el perfil',
  notas: 'Notas',
  'en-casa': 'En casa',
  bitacora: 'Bitácora',
  calendario: 'Calendario',
  conocelo: 'Conocelo en 5 minutos',
}

function mensajeDeError(error) {
  const estado = error?.response?.status
  if (estado === 403) return 'No tenés permiso para ver este proyecto.'
  if (estado === 404) return 'No encontramos este proyecto.'
  if (estado === 401) return 'Tu sesión venció. Ingresá nuevamente.'
  return 'No pudimos cargar el perfil. Revisá tu conexión e intentá nuevamente.'
}

// Perfil del niño: la cabecera (foto, nombre y botonera) queda fija y solo cambia
// la sección de abajo. El proyecto se pide una vez y lo comparten todas las secciones.
export default function PerfilLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    obtenerProyecto(id, controller.signal).then(
      (proyecto) => {
        if (!controller.signal.aborted) setResultado({ id, proyecto })
      },
      (error) => {
        if (!controller.signal.aborted) setResultado({ id, error: mensajeDeError(error) })
      },
    )
    return () => controller.abort()
  }, [id, intento])

  // La foto del niño la cambia solo el tutor administrador (el back también lo controla).
  // Va después del pedido del perfil para que ese salga primero.
  const { esAdmin } = useProyectoActual()

  const recargarProyecto = useCallback(() => setIntento((actual) => actual + 1), [])
  // Al recargar (por ejemplo, después de editar los datos) se sigue mostrando el anterior.
  const proyecto = resultado?.id === id ? resultado.proyecto : null
  const error = resultado?.id === id ? resultado.error : null

  const slug = pathname.replace(/\/+$/, '').split('/')[3] ?? ''
  const seccionActual =
    slug === seccionDesregulacion.slug
      ? seccionDesregulacion
      : seccionesPerfil.find((item) => item.slug === slug)

  const titulo = ESPACIOS[slug] ?? seccionActual?.titulo

  const seccion = titulo ? { titulo } : undefined

  if (!proyecto) {
    return (
      <div className="min-h-svh bg-fondo text-texto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {error ? (
          <div className="space-y-5 rounded-lg bg-superficie p-6">
            <h1 className="font-display text-h1 text-secundario">No pudimos mostrar el perfil</h1>
            <p role="alert">{error}</p>
            <div className="flex flex-wrap gap-4">
              <Boton onClick={recargarProyecto}>Reintentar</Boton>
              <Boton to="/acompanamientos" variant="secondary">
                Volver a acompañamientos
              </Boton>
            </div>
          </div>
        ) : (
          <p role="status" className="py-12 text-center">
            Cargando el perfil…
          </p>
        )}
      </div>
      </div>
    )
  }

  return (
    <PerfilContext.Provider value={{ proyecto, recargarProyecto }}>
      <div className="min-h-svh bg-fondo text-texto">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-8">
          <CabeceraPerfil
            proyecto={proyecto}
            seccion={seccion}
            puedeEditarFoto={esAdmin}
            onCambioFoto={recargarProyecto}
          />
        </div>
        {/* Alto mínimo de una pantalla: mientras carga la sección nueva, la página no se achica
            y no salta el desplazamiento al cambiar de pestaña */}
        <div className="min-h-svh">
          <Outlet />
        </div>
      </div>
    </PerfilContext.Provider>
  )
}

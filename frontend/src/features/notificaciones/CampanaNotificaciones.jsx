import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import {
  obtenerNotificaciones,
  contarNotificacionesNoLeidas,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../../api/notificaciones.js'

export default function CampanaNotificaciones() {
  const navigate = useNavigate()
  const contenedorRef = useRef(null)

  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [cantidad, setCantidad] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const actualizarContador = useCallback(async () => {
    try {
      const total = await contarNotificacionesNoLeidas()
      setCantidad(total)
    } catch {
      // El próximo intervalo volverá a intentarlo.
    }
  }, [])

  const cargarNotificaciones = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const lista = await obtenerNotificaciones()
      setNotificaciones(lista.slice(0, 10))
      await actualizarContador()
    } catch {
      setError('No pudimos cargar las notificaciones.')
    } finally {
      setCargando(false)
    }
  }, [actualizarContador])

  useEffect(() => {
    const controlador = new AbortController()

    async function cargarContadorInicial() {
        try {
        const total = await contarNotificacionesNoLeidas()

        if (!controlador.signal.aborted) {
            setCantidad(total)
        }
        } catch {
        // El próximo intervalo volverá a intentarlo.
        }
    }

    void cargarContadorInicial()

    const intervalo = setInterval(actualizarContador, 60_000)

    return () => {
        controlador.abort()
        clearInterval(intervalo)
    }
}, [actualizarContador])

  useEffect(() => {
    if (!abierto) return

    function cerrarAlHacerClicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) {
        setAbierto(false)
      }
    }

    function cerrarConEscape(evento) {
      if (evento.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', cerrarAlHacerClicFuera)
    document.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  async function alternarDesplegable() {
    const siguiente = !abierto
    setAbierto(siguiente)

    if (siguiente) {
      await cargarNotificaciones()
    }
  }

  async function abrirNotificacion(notificacion) {
    setError('')

    try {
      if (!notificacion.leida) {
        await marcarNotificacionLeida(notificacion.id)
        setNotificaciones((actuales) =>
          actuales.map((item) =>
            item.id === notificacion.id
              ? { ...item, leida: true }
              : item,
          ),
        )
        await actualizarContador()
      }

      // Solo permitimos rutas internas de la aplicación.
      if (
        notificacion.link?.startsWith('/') &&
        !notificacion.link.startsWith('//')
      ) {
        setAbierto(false)
        navigate(notificacion.link)
      } else {
        setError('El enlace de esta notificación no es válido.')
      }
    } catch {
      setError('No pudimos marcar la notificación como leída.')
    }
  }

  async function marcarTodas() {
    setError('')

    try {
      await marcarTodasLeidas()

      setNotificaciones((actuales) =>
        actuales.map((item) => ({ ...item, leida: true })),
      )

      setCantidad(0)
    } catch {
      setError('No pudimos marcar todas como leídas.')
    }
  }

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={alternarDesplegable}
        aria-label={`Notificaciones: ${cantidad} sin leer`}
        aria-expanded={abierto}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-oliva hover:bg-oliva/10"
      >
        <Bell size={23} aria-hidden="true" />

        {cantidad > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-terracota px-1 text-xs font-bold text-superficie">
            {cantidad > 99 ? '99+' : cantidad}
          </span>
        )}
      </button>

      {abierto && (
        <section
          aria-label="Lista de notificaciones"
          className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-oliva/10 bg-superficie p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-oliva">
              Notificaciones
            </h2>

            <button
              type="button"
              onClick={marcarTodas}
              disabled={cantidad === 0}
              className="text-xs font-semibold text-terracota hover:underline disabled:opacity-50"
            >
              Marcar todas como leídas
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-3 text-sm text-terracota">
              {error}
            </p>
          )}

          {cargando ? (
            <p role="status" className="py-5 text-center text-sm">
              Cargando notificaciones...
            </p>
          ) : notificaciones.length === 0 ? (
            <p className="py-5 text-center text-sm text-oliva/70">
              Todavía no tenés notificaciones.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notificaciones.map((notificacion) => (
                <li key={notificacion.id}>
                  <button
                    type="button"
                    onClick={() => abrirNotificacion(notificacion)}
                    className={`w-full rounded-xl p-3 text-left text-sm transition hover:bg-oliva/10 ${
                      notificacion.leida
                        ? 'text-oliva/65'
                        : 'bg-miel/10 font-semibold text-oliva'
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      {!notificacion.leida && (
                        <span
                          aria-label="Sin leer"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-terracota"
                        />
                      )}

                      <span className="min-w-0 break-words">
                        {notificacion.texto}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 6.1: elegir qué avisos llegan también por mail */}
          <Link
            to="/cuenta/notificaciones"
            onClick={() => setAbierto(false)}
            className="mt-3 block border-t border-oliva/10 pt-3 text-center text-sm font-semibold text-terracota hover:underline"
          >
            Elegir avisos por mail
          </Link>
        </section>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeSimple } from '@phosphor-icons/react'
import useAuth from '../../hooks/useAuth.js'
import { Aviso } from '../../components/ui/Aviso.jsx'
import Boton from '../../components/ui/Boton.jsx'
import Interruptor from '../../components/ui/Interruptor.jsx'
import {
  guardarPreferenciasNotificacion,
  obtenerPreferenciasNotificacion,
} from '../../api/notificaciones.js'
import InicioSidebar from '../inicio/InicioSidebar.jsx'
import { TIPOS_AVISO } from './tiposAviso.js'

// 6.1: /cuenta/notificaciones. Elegir qué avisos de la campana llegan también por mail.
export default function PreferenciasNotificacionesPage() {
  const { cerrarSesion } = useAuth()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [preferencias, setPreferencias] = useState(null)
  const [guardando, setGuardando] = useState(null)
  const [estado, setEstado] = useState({ tipo: null, texto: '' })

  useEffect(() => {
    const controller = new AbortController()
    obtenerPreferenciasNotificacion(controller.signal).then(
      (lista) => {
        if (!controller.signal.aborted) setResultado({ intento, lista })
      },
      () => {
        if (!controller.signal.aborted)
          setResultado({ intento, error: 'No pudimos cargar tus preferencias.' })
      },
    )
    return () => controller.abort()
  }, [intento])

  const cargando = resultado?.intento !== intento
  const actuales =
    preferencias ??
    Object.fromEntries((resultado?.lista ?? []).map((item) => [item.tipo, item.porEmail]))

  async function cambiar(tipo, porEmail) {
    if (guardando) return
    const anteriores = actuales
    setPreferencias({ ...actuales, [tipo]: porEmail })
    setGuardando(tipo)
    setEstado({ tipo: null, texto: '' })
    try {
      const lista = await guardarPreferenciasNotificacion([{ tipo, porEmail }])
      setPreferencias(Object.fromEntries(lista.map((item) => [item.tipo, item.porEmail])))
      setEstado({ tipo: 'exito', texto: 'Guardamos tu preferencia.' })
    } catch (error) {
      setPreferencias(anteriores)
      setEstado({
        tipo: 'error',
        texto: error?.response?.data?.mensaje || 'No pudimos guardar el cambio. Intentá nuevamente.',
      })
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div className="min-h-svh bg-fondo text-texto lg:flex">
      <a href="#contenido-notificaciones" className="skip-link">
        Saltar al contenido
      </a>
      <InicioSidebar cerrarSesion={cerrarSesion} />
      <main
        id="contenido-notificaciones"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <h1 className="font-display text-h1 text-secundario sm:text-display">
              Notificaciones
            </h1>
            <p className="mt-2 text-texto-suave">
              Todo te llega a la campana. Elegí qué avisos querés recibir también por mail.
            </p>
          </header>

          {estado.texto && <Aviso tipo={estado.tipo}>{estado.texto}</Aviso>}

          {cargando ? (
            <p role="status">Cargando tus preferencias…</p>
          ) : resultado.error ? (
            <div className="space-y-4 rounded-lg bg-superficie p-6">
              <p role="alert">{resultado.error}</p>
              <Boton onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Boton>
            </div>
          ) : (
            <section
              aria-labelledby="titulo-por-mail"
              className="rounded-lg bg-superficie p-6 shadow-sm"
            >
              <h2
                id="titulo-por-mail"
                className="mb-4 flex items-center gap-2 font-display text-h2 text-secundario"
              >
                <EnvelopeSimple size={24} aria-hidden="true" />
                Avisos por mail
              </h2>
              <ul className="divide-y divide-borde/60">
                {TIPOS_AVISO.filter(([tipo]) => tipo in actuales).map(
                  ([tipo, etiqueta, descripcion]) => (
                    <li key={tipo} className="py-3">
                      <Interruptor
                        id={`aviso-${tipo}`}
                        etiqueta={etiqueta}
                        descripcion={descripcion}
                        checked={actuales[tipo]}
                        disabled={guardando === tipo}
                        onChange={(event) => cambiar(tipo, event.target.checked)}
                      />
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-4 text-sm text-texto-suave">
                Las invitaciones a un acompañamiento siempre llegan por mail, porque traen el link
                para sumarte.
              </p>
            </section>
          )}

          <Link to="/inicio" className="inline-block font-semibold text-primario underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  )
}

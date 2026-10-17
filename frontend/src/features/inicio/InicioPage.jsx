import {
  CalendarBlank,
  ChatCircleText,
  ChartLine,
  SignOut,
  Users,
} from '@phosphor-icons/react'
import BrandLogo from '../../components/ui/BrandLogo.jsx'
import Button from '../../components/ui/Button.jsx'
import useAuth from '../../hooks/useAuth.js'

const modulos = [
  {
    titulo: 'Perfiles',
    detalle:
      'Espacios para conocer intereses, fortalezas y formas de acompañar.',
    icon: Users,
  },
  {
    titulo: 'Seguimiento',
    detalle:
      'Un lugar para compartir observaciones y experiencias del día a día.',
    icon: ChartLine,
  },
  {
    titulo: 'Calendario',
    detalle: 'Encuentros, rutinas y próximos cambios en un mismo lugar.',
    icon: CalendarBlank,
  },
  {
    titulo: 'Comunicaciones',
    detalle: 'Intercambios entre quienes forman parte de la red de apoyo.',
    icon: ChatCircleText,
  },
]

export default function InicioPage() {
  const { usuario, cerrarSesion } = useAuth()
  return (
    <div className="min-h-svh bg-fondo text-texto">
      <header className="border-b border-borde bg-superficie px-6 py-6 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div className="w-40">
            <BrandLogo />
          </div>
          <Button variant="secondary" onClick={() => cerrarSesion()}>
            <SignOut size={20} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main
        tabIndex={-1}
        className="mx-auto max-w-6xl px-6 py-10 sm:px-12 sm:py-16"
      >
        <p className="text-sm font-bold tracking-widest text-secundario">
          TU ESPACIO
        </p>
        <h1 className="mt-3 break-words font-display text-display text-primario">
          ¡Hola, {usuario.nombre}!
        </h1>
        <p className="mt-5 max-w-2xl text-subtitulo leading-relaxed text-texto-suave">
          TRAMA conecta a familias, docentes y profesionales para compartir
          distintas miradas y acompañar a cada niño o niña.
        </p>
        <section
          aria-label="Tu cuenta"
          className="mt-8 rounded-lg border border-borde bg-superficie p-6"
        >
          <h2 className="font-bold text-secundario">Tu cuenta</h2>
          <p className="mt-2 break-words">
            {usuario.nombre} {usuario.apellido}
          </p>
          <p className="mt-1 break-words text-texto-suave">{usuario.email}</p>
        </section>
        <section aria-labelledby="inicio-modulos" className="mt-12">
          <h2
            id="inicio-modulos"
            className="font-display text-h1 text-secundario"
          >
            Una red para acompañar
          </h2>
          <p className="mt-3 text-texto-suave">
            Estos espacios estarán disponibles más adelante.
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {modulos.map((modulo) => {
              const { titulo, detalle, icon: Icon } = modulo
              return (
                <li
                  key={titulo}
                  className="rounded-lg bg-superficie p-6 shadow-sm"
                >
                  <Icon size={32} aria-hidden="true" className="text-agua" />
                  <h3 className="mt-4 font-display text-h2 text-secundario">
                    {titulo}
                  </h3>
                  <p className="mt-2 text-texto-suave">{detalle}</p>
                  <p className="mt-4 text-sm font-bold text-primario">
                    Próximamente
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </div>
  )
}

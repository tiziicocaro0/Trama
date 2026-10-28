import { Link } from 'react-router-dom'
import Logo from '../../../../components/ui/Logo.jsx'

export default function RegistroPresentacion() {
  return (
    <aside className="relative isolate overflow-hidden bg-fondo/40 px-6 py-8 lg:col-span-4 lg:px-12 lg:py-20 xl:px-32">
      <Link
        to="/"
        aria-label="TRAMA: volver a la bienvenida"
        className="ml-0 block w-36 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario lg:ml-6"
      >
        <Logo />
      </Link>
      <div className="relative mt-8 lg:mt-40">
        <h1 className="font-display text-display leading-none text-primario lg:text-registro-portada">
          Crear tu
          <br className="hidden lg:block" /> cuenta
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-texto-suave lg:text-subtitulo">
          Un espacio compartido para acompañar el desarrollo de cada niño o niña
        </p>
      </div>
      <svg
        viewBox="0 0 854 430"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden h-96 w-full lg:block"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="fill-fondo"
          d="M134 306C203 241 236 112 352 126C448 135 467 233 555 253C659 279 727 206 789 275C820 310 836 368 816 430H134Z"
        />
        <path
          className="fill-none stroke-primario"
          strokeWidth="5"
          strokeLinecap="round"
          d="M134 414C230 487 362 471 435 390C493 327 479 288 454 294C399 294 399 383 464 406C547 436 595 365 563 294C534 231 481 239 490 313C496 361 546 397 597 438"
        />
      </svg>
    </aside>
  )
}

import Ovillo from './Ovillo.jsx'

// Mientras carga, el ovillo de TRAMA rueda despacio y su hebra se desenrolla y se vuelve a enrollar.
// Con "reducir movimiento" queda quieto.
export function Cargando({ mensaje = 'Cargando…' }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 py-8 font-sans"
    >
      <div aria-hidden="true" className="flex items-end">
        <Ovillo rodando className="size-12 shrink-0" />
        {/* la hebra suelta, con su rulo, como en la ilustración */}
        <svg viewBox="0 0 30 24" fill="none" className="-ml-2 h-12 w-14">
          <path
            d="M0 19.5 C 5 22.5, 8 20.5, 11.5 19 C 15.5 17.2, 16.5 13.6, 14 13.4 C 11.4 13.2, 11.8 18, 15.6 19.6 C 19.5 21.3, 23 19.5, 25.5 18.4 C 27.5 17.5, 29 19, 29.5 21"
            pathLength="1"
            strokeDasharray="1"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="animate-enrollar stroke-miel motion-reduce:animate-none"
          />
        </svg>
      </div>
      <span className="text-sm font-medium text-oliva">{mensaje}</span>
    </div>
  );
}
export default Cargando;

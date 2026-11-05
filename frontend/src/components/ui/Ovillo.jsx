import { useId } from 'react'

// El ovillo de TRAMA, inspirado en la ilustración de bienvenida (yarn-ball-spiral.png),
// con los colores del tema. Lo usan CasillaOvillo y Cargando.
// rodando: las vueltas giran despacio por dentro, como si el ovillo rodara.
export default function Ovillo({ className = '', rodando = false }) {
  const id = useId()
  const corte = `${id}-corte`
  const volumen = `${id}-volumen`

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={volumen} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="currentColor" className="text-aviso" />
          <stop offset="0.6" stopColor="currentColor" className="text-aviso" />
          <stop offset="1" stopColor="currentColor" className="text-miel" />
        </radialGradient>
        <clipPath id={corte}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>

      {/* sombra */}
      <ellipse cx="12" cy="21.6" rx="7" ry="1.1" className="fill-miel/30" />
      <circle cx="12" cy="12" r="9.5" fill={`url(#${volumen})`} />

      <g clipPath={`url(#${corte})`} fill="none" strokeLinecap="round">
        <g
          className={
            rodando
              ? 'origin-center transform-fill animate-rodar motion-reduce:animate-none'
              : undefined
          }
        >
          {/* hebras finas: la textura de la lana */}
          <g transform="rotate(-22 12 12)" strokeWidth="0.7" className="stroke-miel">
            {[1.4, 3, 4.6, 6.2, 7.8, 9.4].map((ry) => (
              <ellipse key={ry} cx="12" cy="12" rx="11" ry={ry} />
            ))}
          </g>
          {/* vueltas que cruzan */}
          <g transform="rotate(38 12 12)">
            <ellipse cx="12" cy="12" rx="11" ry="3.6" strokeWidth="1.3" className="stroke-terracota" />
            <ellipse cx="12" cy="12" rx="11" ry="6.6" strokeWidth="1.6" className="stroke-miel" />
          </g>
          <g transform="rotate(-64 12 12)">
            <ellipse cx="12" cy="12" rx="11" ry="5.2" strokeWidth="0.9" className="stroke-terracota/80" />
          </g>
        </g>
      </g>

      <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="0.7" className="stroke-terracota/60" />
    </svg>
  )
}

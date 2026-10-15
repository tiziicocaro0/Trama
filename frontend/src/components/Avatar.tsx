import type { Proyecto, TonoAvatar } from '../services/proyectos';

const TONOS: Record<TonoAvatar, string> = {
  terracota: 'bg-terracota',
  agua: 'bg-agua',
  oliva: 'bg-oliva',
  miel: 'bg-miel',
};

const TAMANOS = {
  lista: {
    caja: 'h-[60px] w-[60px] desk:h-[68px] desk:w-[68px]',
    texto: 'text-[22px] desk:text-[24px]',
  },
  detalle: {
    caja: 'h-[88px] w-[88px] desk:h-[112px] desk:w-[112px]',
    texto: 'text-[32px] desk:text-[40px]',
  },
} as const;

const FORMA_ORGANICA = 'rounded-[48%_52%_45%_55%/55%_45%_55%_45%]';

interface AvatarProps {
  proyecto: Proyecto;
  tamano: keyof typeof TAMANOS;
}

export default function Avatar({ proyecto, tamano }: AvatarProps) {
  const { caja, texto } = TAMANOS[tamano];

  if (proyecto.foto) {
    return (
      <img
        src={proyecto.foto}
        alt=""
        className={`shrink-0 object-cover ${caja} ${FORMA_ORGANICA}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-display text-crema ${caja} ${texto} ${FORMA_ORGANICA} ${TONOS[proyecto.tono]}`}
    >
      <svg
        viewBox="0 0 80 80"
        className="absolute inset-0 h-full w-full fill-none stroke-crema/50 stroke-[1.5]"
        strokeLinecap="round"
      >
        <path d="M4 57c19-19 38-7 47-24 6-11 4-22-3-26" />
      </svg>
      <span className="relative">{proyecto.iniciales}</span>
    </span>
  );
}


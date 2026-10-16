import type { ReactNode } from 'react';

interface IconoProps {
  className?: string;
}

function Svg({ className = 'h-5 w-5', children }: IconoProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 fill-none stroke-current ${className}`}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowIcon({ className }: IconoProps) {
  return (
    <Svg className={className}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export function SearchIcon({ className }: IconoProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Svg>
  );
}

export function BellIcon({ className }: IconoProps) {
  return (
    <Svg className={className}>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M9.5 20a3 3 0 0 0 5 0" />
    </Svg>
  );
}

export function ProfileIcon({ className }: IconoProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function PencilIcon({ className }: IconoProps) {
  return (
    <Svg className={className}>
      <path d="m4 20 4.3-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.3 16Z" />
      <path d="m14.5 7.5 2 2" />
    </Svg>
  );
}

export type DetalleIconName =
  | 'edad'
  | 'rol'
  | 'apodo'
  | 'diagnostico'
  | 'escuela'
  | 'intereses';

export function DetalleIcon({ name, className }: IconoProps & { name: DetalleIconName }) {
  switch (name) {
    case 'edad':
      return (
        <Svg className={className}>
          <circle cx="12" cy="8" r="3" />
          <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
        </Svg>
      );
    case 'rol':
      return (
        <Svg className={className}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
          <path d="M15.5 5.5a3 3 0 0 1 0 5.8M16 13h.5a4 4 0 0 1 4 4v1" />
        </Svg>
      );
    case 'apodo':
      return (
        <Svg className={className}>
          <path d="M6 4h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V5a1 1 0 0 1 1-1Z" />
          <path d="M8.5 9h7M8.5 12h4" />
        </Svg>
      );
    case 'diagnostico':
      return (
        <Svg className={className}>
          <path d="M9.5 4.5a2.5 2.5 0 0 1 5 0v.7a3 3 0 0 1 2.8 4.8 3 3 0 0 1-.8 5.8v.7a2.5 2.5 0 0 1-4.5 1.6 2.5 2.5 0 0 1-4.5-1.6v-.7A3 3 0 0 1 6.7 10a3 3 0 0 1 2.8-4.8Z" />
          <path d="M12 5v13M8 10h4M12 14h4" />
        </Svg>
      );
    case 'escuela':
      return (
        <Svg className={className}>
          <path d="m3 10 9-6 9 6v10H3Z" />
          <path d="M9 20v-6h6v6M7 11h.01M17 11h.01" />
        </Svg>
      );
    case 'intereses':
      return (
        <Svg className={className}>
          <path d="M12 20v-8M8 16c-3 0-5-2-5-5 3 0 5 2 5 5ZM16 13c3 0 5-2 5-5-3 0-5 2-5 5Z" />
          <path d="M12 12c-2.5 0-4-1.8-4-4.5 2.5 0 4 1.8 4 4.5Z" />
        </Svg>
      );
  }
}


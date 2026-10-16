import type { ReactNode } from 'react';
import { BellIcon, ProfileIcon } from './Iconos';

const BOTON_HEADER =
  'flex h-10 w-10 items-center justify-center rounded-[14px] border border-borde bg-crema-card text-oliva disabled:cursor-not-allowed';

/**
 * Estructura común de las pantallas: encabezado móvil (oculto desde 860px) y columna de contenido.
 * La navegación lateral/inferior se agregará cuando existan las demás secciones de la app.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-gradient-to-br from-crema via-crema-claro to-crema-oscuro font-sans text-oliva">
      <header className="grid h-[calc(60px+env(safe-area-inset-top))] grid-cols-[40px_1fr_40px] items-center px-5 pt-[env(safe-area-inset-top)] desk:hidden">
        <button type="button" disabled aria-label="Notificaciones" className={BOTON_HEADER}>
          <BellIcon />
        </button>
        <span className="mx-auto max-h-[36px] max-w-[140px] truncate font-display text-[28px] leading-none text-terracota">
          TRAMA
        </span>
        <button type="button" disabled aria-label="Mi perfil" className={BOTON_HEADER}>
          <ProfileIcon />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-5 pb-12 pt-6 desk:px-10 desk:pb-12 desk:pt-10">
        {children}
      </main>
    </div>
  );
}


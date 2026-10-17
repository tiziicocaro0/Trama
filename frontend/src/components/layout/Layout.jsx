import { useAuth } from '../../hooks/useAuth';
import { NavLink, Outlet } from 'react-router-dom';
import logoTrama from '../../assets/logo.png';
const ITEMS_NAVEGACION = [
  { ruta: '/proyectos', etiqueta: 'Acompañamientos', icono: 'acompanamientos' },
  { ruta: '/recursos', etiqueta: 'Recursos', icono: 'recursos' },
  { ruta: '/calendario', etiqueta: 'Calendario', icono: 'calendario' },
  { ruta: '/perfil', etiqueta: 'Mi perfil', icono: 'perfil' },
];
function IconoMenu({ nombre }) {
  const propsComunes = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5 shrink-0 fill-none stroke-current stroke-2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (nombre === 'acompanamientos') {
    return (
      <svg {...propsComunes}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
        <path d="M15.5 5.5a3 3 0 0 1 0 5.8M16 13h.5a4 4 0 0 1 4 4v1" />
      </svg>
    );
  }
  if (nombre === 'recursos') {
    return (
      <svg {...propsComunes}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a1 1 0 0 1 1 1v16a3 3 0 0 0-3-3H4z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13a1 1 0 0 0-1 1v16a3 3 0 0 1 3-3h5z" />
      </svg>
    );
  }
  if (nombre === 'calendario') {
    return (
      <svg {...propsComunes}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    );
  }
  return (
    <svg {...propsComunes}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
function LogoTrama({ className = 'h-10 w-auto' }) {
  return (
    <div className="inline-flex items-center select-none" aria-label="TRAMA">
      <img
        src={logoTrama}
        alt="TRAMA"
        className={`object-contain mix-blend-multiply ${className}`.trim()}
      />
    </div>
  );
}
export function Layout() {
  const { cerrarSesion } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-crema font-sans text-oliva md:flex-row">
      {/* Encabezado mobile: campana a la izquierda y logo TRAMA arriba a la derecha */}
      <header className="flex items-center justify-between border-b border-oliva/10 bg-crema px-5 py-3.5 md:hidden">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-oliva/80 hover:bg-oliva/10"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current stroke-2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
            <path d="M9.5 20a3 3 0 0 0 5 0" />
          </svg>
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-miel"
          />
        </button>
        <div className="flex items-center gap-3">
          <LogoTrama className="h-9 w-auto" />
          <button
            type="button"
            onClick={() => cerrarSesion()}
            className="rounded-full px-3 py-2 text-sm font-semibold text-terracota hover:bg-oliva/10"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-oliva/10 bg-superficie/40 px-6 py-9 md:flex">
        <div>
          <div className="mb-10 flex justify-center">
            <LogoTrama className="h-12 w-auto" />
          </div>

          <nav
            aria-label="Navegación principal"
            className="flex flex-col gap-2"
          >
            {ITEMS_NAVEGACION.map((item) => (
              <NavLink
                key={item.ruta}
                to={item.ruta}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-miel/15 font-bold text-terracota'
                      : 'font-medium text-oliva/75 hover:bg-oliva/5 hover:text-oliva'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <IconoMenu nombre={item.icono} />
                      <span>{item.etiqueta}</span>
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-miel"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <p className="px-2 font-display text-base leading-snug text-agua">
            Distintas miradas, una misma persona.
          </p>
          <button
            type="button"
            onClick={() => cerrarSesion()}
            className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-terracota hover:bg-oliva/5"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Barra de navegación inferior mobile */}
      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-oliva/10 bg-superficie/95 py-2 md:hidden"
      >
        {ITEMS_NAVEGACION.map((item) => (
          <NavLink
            key={item.ruta}
            to={item.ruta}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs transition ${isActive ? 'font-bold text-terracota' : 'font-medium text-oliva/70'}`
            }
          >
            <IconoMenu nombre={item.icono} />
            <span>{item.etiqueta}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
export default Layout;

export interface CargandoProps {
  mensaje?: string;
}

export function Cargando({ mensaje = 'Cargando…' }: CargandoProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-8 font-sans">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-miel/30 border-t-terracota"
      />
      <span className="text-sm font-medium text-oliva">{mensaje}</span>
    </div>
  );
}

export default Cargando;


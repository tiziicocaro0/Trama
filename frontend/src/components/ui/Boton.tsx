import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  children: ReactNode;
}

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-terracota text-crema shadow-sm hover:bg-terracota/90',
  secundario: 'bg-agua text-crema shadow-sm hover:bg-agua/90',
  peligro: 'bg-error text-crema shadow-sm hover:bg-error/90',
  fantasma: 'border border-miel bg-transparent text-miel hover:bg-miel/10',
};

export function Boton({
  variante = 'primario',
  className = '',
  type = 'button',
  children,
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-space-2 rounded-full px-space-5 py-space-3 font-sans text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${CLASES_VARIANTE[variante]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Boton;

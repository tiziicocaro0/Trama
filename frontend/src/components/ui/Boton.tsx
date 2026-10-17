import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma';

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  children: ReactNode;
}

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-terracota text-crema hover:bg-terracota/90',
  secundario: 'bg-agua text-crema hover:bg-agua/90',
  fantasma: 'border border-oliva/30 bg-transparent text-oliva hover:bg-oliva/10',
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 font-sans text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${CLASES_VARIANTE[variante]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Boton;


import type { HTMLAttributes, ReactNode } from 'react';

export interface TarjetaProps extends HTMLAttributes<HTMLDivElement> {
  titulo?: string;
  children: ReactNode;
}

export function Tarjeta({ titulo, children, className = '', ...props }: TarjetaProps) {
  return (
    <div
      className={`rounded-3xl border border-oliva/10 bg-superficie p-5 shadow-sm md:p-6 ${className}`.trim()}
      {...props}
    >
      {titulo && (
        <h3 className="mb-3 font-display text-2xl font-normal text-terracota">{titulo}</h3>
      )}
      {children}
    </div>
  );
}

export default Tarjeta;

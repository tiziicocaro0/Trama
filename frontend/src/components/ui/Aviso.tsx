import type { ReactNode } from 'react';

export type TipoAviso = 'info' | 'exito' | 'alerta' | 'error';

export interface AvisoProps {
  tipo?: TipoAviso;
  children: ReactNode;
}

const CLASES_TIPO: Record<TipoAviso, string> = {
  info: 'border-agua bg-agua/15 text-oliva',
  exito: 'border-oliva bg-oliva/10 text-oliva',
  alerta: 'border-miel bg-miel/20 text-oliva',
  error: 'border-terracota bg-terracota/15 text-terracota',
};

export function Aviso({ tipo = 'info', children }: AvisoProps) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border px-4 py-3 font-sans text-sm font-medium ${CLASES_TIPO[tipo]}`}
    >
      {children}
    </div>
  );
}

export default Aviso;


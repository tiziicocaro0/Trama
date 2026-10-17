import type { ReactNode } from 'react';

export interface ModalProps {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

export function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-oliva/40 p-4"
    >
      <div className="w-full max-w-lg rounded-3xl border border-oliva/20 bg-crema p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-titulo" className="font-display text-2xl font-normal text-terracota">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal"
            className="flex h-9 w-9 items-center justify-center rounded-full text-oliva hover:bg-oliva/10"
          >
            ✕
          </button>
        </div>
        <div className="font-sans text-base text-oliva">{children}</div>
      </div>
    </div>
  );
}

export default Modal;


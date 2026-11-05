import { useEffect, useRef } from 'react';

// cerrarAlTocarFuera: tocar el fondo o apretar Escape cierra el modal. Solo para
// formularios que no pierden lo escrito al cerrarse (por ejemplo, porque guardan un borrador).
export function Modal({ abierto, titulo, onCerrar, cerrarAlTocarFuera = false, children }) {
  const cerrarActual = useRef(onCerrar);
  useEffect(() => {
    cerrarActual.current = onCerrar;
  }, [onCerrar]);
  useEffect(() => {
    if (!abierto || !cerrarAlTocarFuera) return undefined;
    function alTeclar(evento) {
      if (evento.key === 'Escape') cerrarActual.current?.();
    }
    document.addEventListener('keydown', alTeclar);
    return () => document.removeEventListener('keydown', alTeclar);
  }, [abierto, cerrarAlTocarFuera]);

  if (!abierto) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-oliva/40 p-4"
      onMouseDown={(evento) => {
        if (cerrarAlTocarFuera && evento.target === evento.currentTarget) onCerrar?.();
      }}
    >
      <div className="max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-oliva/20 bg-crema p-4 shadow-lg sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="modal-titulo"
            className="font-display text-2xl font-normal text-terracota"
          >
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

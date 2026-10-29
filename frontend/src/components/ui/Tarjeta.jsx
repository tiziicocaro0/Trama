export function Tarjeta({ titulo, children, className = '', ...props }) {
  return (
    <div
      className={`rounded-lg border border-borde bg-superficie p-space-4 shadow-sm transition-shadow hover:shadow-md md:p-space-5 ${className}`.trim()}
      {...props}
    >
      {titulo && (
        <h3 className="mb-space-3 font-display text-2xl font-normal text-terracota">
          {titulo}
        </h3>
      )}
      {children}
    </div>
  );
}
export default Tarjeta;

import Logo from '../../components/ui/Logo.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

// Handlee para títulos expresivos y Nunito Sans para todo lo funcional (docs/branding.md)
export function SeccionTipografia() {
  return (
    <Tarjeta titulo="Tipografía y logo">
      <div className="space-y-3">
        <Logo />
        <p className="font-display text-display text-terracota">Display · Handlee</p>
        <p className="font-display text-h1 text-secundario">Título 1 · Handlee</p>
        <p className="font-display text-h2 text-secundario">Título 2 · Handlee</p>
        <p className="font-sans text-base text-texto">Texto · Nunito Sans. Distintas miradas, una misma persona.</p>
        <p className="font-sans text-sm text-texto-suave">Texto secundario · Nunito Sans</p>
        <p className="font-sans text-xs text-texto-suave">Leyenda · Nunito Sans</p>
      </div>
    </Tarjeta>
  )
}

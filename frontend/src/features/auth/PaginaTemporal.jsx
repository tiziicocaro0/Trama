import { ArrowLeft } from '@phosphor-icons/react'
import BrandLogo from '../../components/ui/BrandLogo.jsx'
import Button from '../../components/ui/Button.jsx'

export default function PaginaTemporal({ title }) {
  return (
    <main
      tabIndex={-1}
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-superficie p-6 text-center text-texto"
    >
      <BrandLogo className="brand-logo-compact" />
      <div className="max-w-lg space-y-4">
        <p className="font-sans text-sm font-bold uppercase tracking-widest text-primario">
          Pantalla temporal
        </p>
        <h1 className="font-display text-h1 text-primario">{title}</h1>
        <p>Esta pantalla está pendiente de implementación.</p>
      </div>
      <Button to="/" variant="secondary">
        <ArrowLeft size={20} aria-hidden="true" />
        Volver a la bienvenida
      </Button>
    </main>
  )
}

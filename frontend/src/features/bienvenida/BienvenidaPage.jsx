import BrandLogo from '../../components/ui/BrandLogo.jsx'
import Button from '../../components/ui/Button.jsx'
import WelcomeBackdrop from './components/WelcomeBackdrop.jsx'

export default function BienvenidaPage() {
  return (
    <div className="welcome-shell">
      <WelcomeBackdrop />
      <a href="#contenido" className="skip-link">
        Ir al contenido
      </a>
      <header className="welcome-header">
        <BrandLogo />
      </header>
      <main id="contenido" className="welcome-main" tabIndex={-1}>
        <div className="welcome-illustration" aria-hidden="true">
          <img
            src="/assets/branding/yarn-ball-spiral.png"
            alt=""
            width="1790"
            height="878"
          />
        </div>
        <div className="welcome-content">
          <h1 className="font-display text-h1 leading-snug text-agua">
            Distintas miradas,
            <br />
            una misma persona.
          </h1>
          <nav aria-label="Acceso a TRAMA" className="welcome-actions">
            <Button to="/login">Iniciar sesión</Button>
            <Button to="/registro" variant="secondary">
              Crear cuenta
            </Button>
          </nav>
        </div>
      </main>
    </div>
  )
}

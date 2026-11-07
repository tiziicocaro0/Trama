import { Cargando } from '../../components/ui/Cargando'
import Ovillo from '../../components/ui/Ovillo.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

// El dibujo del ovillo (inspirado en yarn-ball-spiral.png) y el indicador de carga que lo usa
export function SeccionOvillo() {
  return (
    <Tarjeta titulo="Ovillo">
      <div className="flex flex-wrap items-end gap-8">
        {[['size-5', '20 px'], ['size-7', '28 px'], ['size-12', '48 px'], ['size-20', '80 px']].map(([clase, texto]) => (
          <figure key={texto} className="flex flex-col items-center gap-2">
            <Ovillo className={clase} />
            <figcaption className="text-xs text-texto-suave">{texto}</figcaption>
          </figure>
        ))}
        <figure className="flex flex-col items-center gap-2">
          <Ovillo rodando className="size-20" />
          <figcaption className="text-xs text-texto-suave">rodando</figcaption>
        </figure>
        <Cargando mensaje="Cargando el perfil…" />
      </div>
    </Tarjeta>
  )
}

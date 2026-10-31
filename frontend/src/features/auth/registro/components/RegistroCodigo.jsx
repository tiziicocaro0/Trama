import { Key } from '@phosphor-icons/react'
import Campo from '../../../../components/ui/Campo.jsx'
import CampoFormulario from '../../../../components/ui/CampoFormulario.jsx'

// Último paso del registro: el código de 6 dígitos que llega por mail.
export default function RegistroCodigo({ registro }) {
  const { valores, errores, aviso, enviando, segundosReenvio, cambiar, reenviar } = registro
  return (
    <div className="space-y-4">
      <CampoFormulario
        id="registro-codigo"
        label="Código de 6 dígitos"
        error={errores.codigo}
        hint="Si no lo ves, revisá la carpeta de spam o de promociones."
      >
        <Campo
          name="codigo"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Código de 6 dígitos"
          icon={Key}
          value={valores.codigo}
          onChange={cambiar}
          maxLength={6}
          className="tracking-widest"
          required
          disabled={enviando}
        />
      </CampoFormulario>
      {aviso && (
        <p role="status" className="text-sm text-secundario">
          {aviso}
        </p>
      )}
      <button
        type="button"
        onClick={reenviar}
        disabled={enviando || segundosReenvio > 0}
        className="rounded-sm font-bold text-primario hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primario disabled:cursor-not-allowed disabled:text-texto-suave disabled:no-underline"
      >
        {segundosReenvio > 0
          ? `Reenviar código en ${segundosReenvio} s`
          : 'Reenviar código'}
      </button>
    </div>
  )
}

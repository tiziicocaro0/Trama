import { IdentificationCard } from '@phosphor-icons/react'
import Campo from '../../../../components/ui/Campo.jsx'
import RadioOvillo from '../../../../components/ui/RadioOvillo.jsx'
import CampoFormulario from '../../../../components/ui/CampoFormulario.jsx'
import SelectorEspecialidades from '../../../perfil/components/SelectorEspecialidades.jsx'
import { AREAS_PROFESIONALES, TIPOS_CUENTA } from '../tipoCuenta.js'

function Opciones({ nombre, legend, opciones, valor, onElegir, error, enviando }) {
  const idError = `registro-${nombre}-error`
  return (
    <fieldset aria-describedby={error ? idError : undefined} className="space-y-3">
      <legend className="mb-3 text-lg text-texto">{legend}</legend>
      {opciones.map((opcion) => (
        <RadioOvillo
          key={opcion.valor}
          name={nombre}
          value={opcion.valor}
          checked={valor === opcion.valor}
          onChange={() => onElegir(opcion.valor)}
          disabled={enviando}
          descripcion={opcion.descripcion}
        >
          {opcion.titulo}
        </RadioOvillo>
      ))}
      {error && (
        <p id={idError} className="text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

// 9.4: segundo paso del registro. Familia o profesional; el profesional elige
// primero su área (educación o salud) y después qué hace.
export default function RegistroTipoCuenta({ registro }) {
  const { valores, errores, enviando, elegir, cambiar, cambiarEspecialidades } = registro

  return (
    <div className="space-y-6">
      <Opciones
        nombre="tipoCuenta"
        legend="¿Cómo vas a usar TRAMA?"
        opciones={TIPOS_CUENTA}
        valor={valores.tipoCuenta}
        onElegir={(valor) => elegir('tipoCuenta', valor)}
        error={errores.tipoCuenta}
        enviando={enviando}
      />
      {valores.tipoCuenta === 'PROFESIONAL' && (
        <Opciones
          nombre="area"
          legend="¿En qué área trabajás?"
          opciones={AREAS_PROFESIONALES}
          valor={valores.area}
          onElegir={(valor) => elegir('area', valor)}
          error={errores.area}
          enviando={enviando}
        />
      )}
      {valores.tipoCuenta === 'PROFESIONAL' && valores.area && (
        <section aria-labelledby="registro-especialidades" className="space-y-3">
          <h3 id="registro-especialidades" className="text-lg text-texto">
            ¿Qué hacés?
          </h3>
          <p className="text-texto-suave">
            Las vamos a precargar cuando te sumes a cada niño. Ahí podés ajustarlas.
          </p>
          <SelectorEspecialidades
            id="registro-especialidades-lista"
            rol={valores.area}
            value={valores.especialidades}
            onChange={cambiarEspecialidades}
            disabled={enviando}
            error={errores.especialidades}
          />
        </section>
      )}
      {valores.tipoCuenta === 'PROFESIONAL' && valores.area && (
        <CampoFormulario
          id="registro-matricula"
          label="Matrícula (opcional)"
          error={errores.matricula}
          hint="La ve la red de cada niño. TRAMA no verifica que sea válida. El comprobante lo podés sumar después, desde Mi perfil."
        >
          <Campo
            name="matricula"
            placeholder="Matrícula (opcional)"
            icon={IdentificationCard}
            value={valores.matricula}
            onChange={cambiar}
            maxLength={40}
            disabled={enviando}
          />
        </CampoFormulario>
      )}
    </div>
  )
}

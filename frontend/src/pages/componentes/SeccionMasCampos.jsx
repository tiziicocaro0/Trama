import { useState } from 'react'
import { CalendarBlank, UsersThree } from '@phosphor-icons/react'
import CampoFecha from '../../components/ui/CampoFecha.jsx'
import CampoFormulario from '../../components/ui/CampoFormulario.jsx'
import CampoSelector from '../../components/ui/CampoSelector.jsx'
import SelectorVisibilidad from '../../components/ui/SelectorVisibilidad.jsx'
import { Tarjeta } from '../../components/ui/Tarjeta'

const ROLES = [
  { valor: 'FAMILIAR', etiqueta: 'Familia' },
  { valor: 'EDUCACION', etiqueta: 'Educación' },
  { valor: 'SALUD', etiqueta: 'Salud' },
]

export function SeccionMasCampos() {
  const [fecha, setFecha] = useState('2017-03-12')
  const [rol, setRol] = useState('FAMILIAR')
  const [visibilidad, setVisibilidad] = useState('TODOS')
  const [sensorial, setSensorial] = useState('TODOS')

  return (
    <Tarjeta titulo="Fecha, desplegable y visibilidad">
      <div className="grid gap-6 sm:grid-cols-2">
        <CampoFormulario id="vitrina-fecha" label="Fecha de nacimiento">
          <CampoFecha id="vitrina-fecha" name="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </CampoFormulario>
        <CampoFormulario id="vitrina-rol" label="Rol en la red">
          <CampoSelector id="vitrina-rol" icon={UsersThree} opciones={ROLES} value={rol} onChange={(e) => setRol(e.target.value)} />
        </CampoFormulario>
        <SelectorVisibilidad id="vitrina-visibilidad" value={visibilidad} onChange={(e) => setVisibilidad(e.target.value)} />
        <SelectorVisibilidad id="vitrina-sensorial" sensorial value={sensorial} onChange={(e) => setSensorial(e.target.value)} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-texto-suave">
        <CalendarBlank size={14} aria-hidden="true" /> Fecha elegida: {fecha || 'ninguna'}
      </p>
    </Tarjeta>
  )
}

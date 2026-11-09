import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import CasillaOvillo from './CasillaOvillo.jsx'

// Quién puede ver: casillas que se combinan en uno de los valores que guarda el back.
// Los tutores siempre ven todo; la familia solo ve lo que es para toda la red.
//   Toda la red → TODOS · Educación y salud → PROFESIONALES · Solo educación → SOLO_EDUCACION
//   Solo salud → SOLO_SALUD · Solo tutores → SOLO_TUTORES · Nada marcado → ''
const RESUMEN = {
  TODOS: 'Toda la red',
  PROFESIONALES: 'Tutores, equipo de educación y equipo de salud',
  SOLO_EDUCACION: 'Tutores y equipo de educación',
  SOLO_SALUD: 'Tutores y equipo de salud',
  SOLO_TUTORES: 'Solo tutores',
}

function grupos(valor) {
  return {
    red: valor === 'TODOS',
    tutores: Boolean(RESUMEN[valor]),
    educacion: ['TODOS', 'PROFESIONALES', 'SOLO_EDUCACION'].includes(valor),
    salud: ['TODOS', 'PROFESIONALES', 'SOLO_SALUD'].includes(valor),
  }
}

function valorDe({ educacion, salud }) {
  if (educacion && salud) return 'PROFESIONALES'
  if (educacion) return 'SOLO_EDUCACION'
  if (salud) return 'SOLO_SALUD'
  return 'SOLO_TUTORES'
}

// Muestra un resumen; al tocarlo se despliegan las casillas y quedan abiertas hasta volver a tocarlo.
export default function SelectorVisibilidad({
  id,
  value,
  onChange,
  disabled,
  leyenda = '¿Quién puede ver este aporte?',
}) {
  const [abierto, setAbierto] = useState(!RESUMEN[value])
  const marcado = grupos(value)

  function cambiar(valor) {
    onChange({ target: { value: valor } })
  }

  // Toda la red marca todo; si ya estaba, desmarca todo
  function alternarRed() {
    cambiar(marcado.red ? '' : 'TODOS')
  }

  function alternarTutores() {
    cambiar(marcado.tutores ? '' : 'SOLO_TUTORES')
  }

  function alternarEquipo(equipo) {
    cambiar(valorDe({ ...marcado, [equipo]: !marcado[equipo] }))
  }

  const opciones = [
    ['red', 'Toda la red', 'Incluye a la familia y a todo el equipo.', alternarRed, false],
    [
      'tutores',
      'Tutores',
      'Siempre pueden ver todo lo que se carga.',
      alternarTutores,
      marcado.educacion || marcado.salud,
    ],
    ['educacion', 'Equipo de educación', 'Docentes, integradoras y equipo de orientación.', () => alternarEquipo('educacion'), false],
    ['salud', 'Equipo de salud', 'Psicología, fonoaudiología, terapia ocupacional y más.', () => alternarEquipo('salud'), false],
  ]

  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{leyenda}</legend>

      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        disabled={disabled}
        aria-expanded={abierto}
        aria-label={`Elegir quién puede ver. Ahora: ${RESUMEN[value] ?? 'sin elegir'}`}
        className={`flex w-full items-center justify-between gap-3 rounded-md border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed motion-reduce:transition-none ${RESUMEN[value] ? 'border-primario bg-primario/5' : 'border-borde bg-superficie'} ${abierto ? 'mb-2' : ''}`}
      >
        <span className={RESUMEN[value] ? 'font-semibold text-texto' : 'text-texto-suave'}>
          {RESUMEN[value] ?? 'Elegí quién puede verlo'}
        </span>
        <CaretDown
          size={20}
          aria-hidden="true"
          className={`shrink-0 text-primario transition-transform motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="space-y-2 rounded-md border border-borde bg-superficie p-3">
          {opciones.map(([clave, etiqueta, descripcion, alternar, fija]) => (
            <CasillaOvillo
              key={clave}
              name={`${id}-${clave}`}
              checked={marcado[clave]}
              onChange={alternar}
              disabled={disabled || fija}
              className="w-full"
            >
              <span>
                <span className="block font-semibold text-texto">{etiqueta}</span>
                <span className="block text-sm text-texto-suave">{descripcion}</span>
              </span>
            </CasillaOvillo>
          ))}
        </div>
      )}
    </fieldset>
  )
}

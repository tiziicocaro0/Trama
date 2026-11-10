import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PREGUNTAS_GUIA } from '../../utils/preguntasGuia.js'
import PreguntaGuia from './PreguntaGuia.jsx'

// 2.9: cada sección donde se carga información tiene una pregunta guía y un ejemplo
it.each([
  'FORTALEZA', 'INTERES', 'COMUNICACION', 'SENSORIAL', 'ESTRATEGIA', 'RUTINA', 'DESREGULACION',
  'NOTA_PROFESIONAL', 'OBSERVACION', 'ABC',
])('muestra la pregunta guía y el ejemplo de %s', (tipo) => {
  render(<PreguntaGuia tipo={tipo} />)
  expect(screen.getByText(PREGUNTAS_GUIA[tipo].pregunta)).toBeInTheDocument()
  expect(screen.getByText(PREGUNTAS_GUIA[tipo].ejemplo)).toBeInTheDocument()
})

it('las preguntas están en positivo y los ejemplos empiezan con "Ejemplo:"', () => {
  for (const { pregunta, ejemplo } of Object.values(PREGUNTAS_GUIA)) {
    expect(pregunta).toMatch(/^¿.+\?$/)
    expect(pregunta).not.toMatch(/\b(no|nunca)\b/i)
    expect(ejemplo).toMatch(/^Ejemplo: /)
  }
})

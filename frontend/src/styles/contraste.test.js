import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/tema.css', 'utf8')

function luminance(token) {
  const hex = css.match(
    new RegExp(`--color-${token}:\\s*#([a-f0-9]{6});`, 'i'),
  )?.[1]
  if (!hex) throw new Error(`Token ausente: ${token}`)
  const channels = hex.match(/../g).map((value) => {
    const channel = parseInt(value, 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('Contraste WCAG AA del tema de bienvenida', () => {
  it.each([
    ['superficie', 'primario'],
    ['superficie', 'primario-hover'],
    ['primario', 'superficie'],
    ['primario', 'decoracion'],
    ['texto', 'borde'],
    ['texto', 'superficie'],
    ['texto-suave', 'superficie'],
    ['superficie', 'bienvenida-accion'],
    ['primario', 'bienvenida-papel'],
    ['primario', 'bienvenida-luz'],
  ])('%s sobre %s cumple 4.5:1 para texto normal', (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    'superficie',
    'decoracion',
    'bienvenida-papel',
    'bienvenida-luz',
    'bienvenida-curva',
  ])('agua sobre %s cumple 3:1 para la frase grande', (background) => {
    expect(contrast('agua', background)).toBeGreaterThanOrEqual(3)
  })
})

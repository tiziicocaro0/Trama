import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Basado en el test de contraste de Zoe, adaptado a los tokens de tema.css.
const css = readFileSync('src/styles/tema.css', 'utf8');

function luminancia(token) {
  const hex = css.match(
    new RegExp(`--color-${token}:\\s*#([a-f0-9]{6});`, 'i'),
  )?.[1];
  if (!hex) throw new Error(`Token ausente: ${token}`);
  const canales = hex.match(/../g).map((valor) => {
    const canal = parseInt(valor, 16) / 255;
    return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722;
}

function contraste(frente, fondo) {
  const [a, b] = [luminancia(frente), luminancia(fondo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

describe('Contraste WCAG AA de tema.css', () => {
  it.each([
    ['texto', 'fondo'],
    ['texto', 'superficie'],
    ['texto-suave', 'superficie'],
    ['primario', 'fondo'],
    ['secundario', 'fondo'],
    ['crema', 'primario'],
    ['crema', 'secundario'],
    ['crema', 'error'],
  ])('%s sobre %s cumple 4.5:1 para texto normal', (frente, fondo) => {
    expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(4.5);
  });
});

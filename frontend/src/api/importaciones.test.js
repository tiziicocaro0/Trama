import { describe, expect, it } from 'vitest'

// Vite resuelve los imports recién en el navegador: si una pantalla importa algo que un
// archivo de src/api/ ya no exporta, los tests pasan pero la app no arranca. Este test lo detecta.
const codigo = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
const modulosApi = import.meta.glob(['./*.js', '!./*.test.js'], { eager: true })

const IMPORTACION = /import\s+(?:\w+\s*,\s*)?\{([^}]+)\}\s+from\s+['"]([^'"]*\/api\/(\w+)\.js)['"]/g

describe('importaciones de src/api', () => {
  it('todo lo que el front importa de src/api/ existe', () => {
    const faltantes = []
    for (const [archivo, fuente] of Object.entries(codigo)) {
      for (const [, nombres, , modulo] of fuente.matchAll(IMPORTACION)) {
        const exportados = modulosApi[`./${modulo}.js`]
        for (const nombre of nombres.split(',').map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean)) {
          if (!exportados || !(nombre in exportados)) faltantes.push(`${archivo}: ${nombre} de api/${modulo}.js`)
        }
      }
    }
    expect(faltantes).toEqual([])
  })
})

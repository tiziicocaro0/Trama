import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = new URL('../src/', import.meta.url)
const errors = []
const forbidden = [
  [
    /(?:#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\s*\()/i,
    'Color fuera de tema.css',
  ],
  [/\bstyle\s*=/, 'Estilo inline'],
  [/[\w-]+-\[[^\]]+\]/, 'Valor arbitrario de Tailwind'],
  [
    /\b(?:bg|text|border|ring|outline|fill|stroke|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b/,
    'Color ajeno al tema',
  ],
]

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await checkDirectory(path)
    } else if (/\.(?:js|jsx|css)$/.test(entry.name)) {
      if (entry.name === 'tema.css') continue
      if (entry.name.endsWith('.css'))
        errors.push(`${path}: CSS fuera de tema.css`)
      const content = await readFile(path, 'utf8')
      for (const [pattern, message] of forbidden) {
        if (pattern.test(content))
          errors.push(`${relative(process.cwd(), path)}: ${message}`)
      }
    }
  }
}

await checkDirectory(fileURLToPath(root))
if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(
    'Estilos correctos: tokens centralizados, sin colores sueltos ni estilos inline.\n',
  )
}

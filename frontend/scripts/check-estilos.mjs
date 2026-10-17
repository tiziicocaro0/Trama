import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(rootDir, 'src');

const PATRONES_PROHIBIDOS = [
  { regex: /-\[#[0-9a-fA-F]+\]/g, descripcion: 'Color hex arbitrario de Tailwind (ej. bg-[#...])' },
  { regex: /-\[[^\]]*px\]/g, descripcion: 'Medida arbitraria en px de Tailwind (ej. p-[13px])' },
  { regex: /-\[(?:rgb|rgba|hsl|hsla)\(/g, descripcion: 'Color rgb/hsl arbitrario de Tailwind' },
  { regex: /style=\{\{/g, descripcion: 'Estilo en línea (style={{ ... }})' },
];

function obtenerArchivos(dir) {
  let resultados = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    const stat = statSync(ruta);
    if (stat.isDirectory()) {
      resultados = resultados.concat(obtenerArchivos(ruta));
    } else if (/\.(tsx?|jsx?)$/.test(entrada) && !/\.test\.(tsx?|jsx?)$/.test(entrada)) {
      resultados.push(ruta);
    }
  }
  return resultados;
}

const archivos = obtenerArchivos(srcDir);
const errores = [];

for (const archivo of archivos) {
  const contenido = readFileSync(archivo, 'utf8');
  const lineas = contenido.split('\n');

  lineas.forEach((linea, indice) => {
    for (const patron of PATRONES_PROHIBIDOS) {
      patron.regex.lastIndex = 0;
      const match = patron.regex.exec(linea);
      if (match) {
        errores.push(
          `${relative(rootDir, archivo)}:${indice + 1} -> ${patron.descripcion}: "${match[0]}"`,
        );
      }
    }
  });
}

if (errores.length > 0) {
  console.error('Error en check:estilos — Se detectaron estilos no permitidos:\n');
  for (const err of errores) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('check:estilos OK — Sin clases arbitrarias ni estilos en línea.');


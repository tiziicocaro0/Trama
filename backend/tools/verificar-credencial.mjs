import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const directorioHerramienta = dirname(fileURLToPath(import.meta.url))
const raizTrama = resolve(directorioHerramienta, '../..')
const consultaPuerto = spawnSync('powershell.exe', ['-NoProfile', '-Command',
  'Get-NetTCPConnection -LocalPort 4002 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique'], { encoding: 'utf8' })
const proceso = consultaPuerto.stdout?.trim()
if (consultaPuerto.status !== 0 || !/^\d+$/.test(proceso || '')) {
  process.stderr.write('No se pudo identificar un único backend local en el puerto 4002.\n')
  process.exit(1)
}

// Se reutilizan las clases y dependencias del proceso real sin imprimir propiedades.
const propiedades = spawnSync('jcmd', [proceso, 'VM.system_properties'], { encoding: 'utf8' })
const lineaClasspath = propiedades.stdout?.split(/\r?\n/).find((linea) => linea.startsWith('java.class.path='))
if (propiedades.status !== 0 || !lineaClasspath) {
  process.stderr.write('No se pudieron consultar las dependencias del backend. Ejecutá con el mismo usuario y JDK.\n')
  process.exit(1)
}
const classpath = lineaClasspath.slice('java.class.path='.length).replace(/\\\\/g, '\\').replace(/\\:/g, ':')
const argumentos = ['--class-path', classpath, resolve(directorioHerramienta, 'VerificarCredencial.java'), raizTrama]
if (process.argv.includes('--comprobar-seed')) argumentos.push('--comprobar-seed')
const resultado = spawnSync('java', argumentos, { stdio: 'inherit' })
process.exitCode = resultado.status ?? 1

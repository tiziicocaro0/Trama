import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'vite'

// Prueba optativa contra el backend configurado: crea una cuenta ficticia real.
const server = await createServer({ server: { middlewareMode: true } })
try {
  const { registrarUsuario, iniciarSesion, obtenerIdentidad } =
    await server.ssrLoadModule('/src/api/auth.js')
  const {
    default: cliente,
    guardarToken,
    obtenerToken,
  } = await server.ssrLoadModule('/src/api/cliente.js')
  const datos = {
    nombre: 'Nora',
    apellido: 'Prueba',
    email: `trama.flujo.${randomUUID()}@example.test`,
    password: `  Trama9!${randomUUID()} éÑ€  `,
  }
  guardarToken(null)
  await assert.rejects(
    obtenerIdentidad(),
    (error) => error.response?.status === 401,
  )
  await registrarUsuario(datos)
  assert.ok(obtenerToken())
  const identidad = await obtenerIdentidad()
  assert.equal(identidad.nombre, datos.nombre)
  assert.equal(identidad.email, datos.email)
  guardarToken(null)
  await assert.rejects(
    obtenerIdentidad(),
    (error) => error.response?.status === 401,
  )
  await iniciarSesion({ email: datos.email, password: 'Incorrecta9!' }).then(
    () => assert.fail('El backend aceptó una contraseña incorrecta'),
    (error) => assert.match(error.message, /no son correctos/),
  )
  await iniciarSesion(datos)
  assert.equal((await obtenerIdentidad()).id, identidad.id)
  guardarToken('jwt-invalido-de-prueba')
  await assert.rejects(
    obtenerIdentidad(),
    (error) => error.response?.status === 401,
  )
  assert.equal(obtenerToken(), null)
  const cors = await fetch(`${cliente.defaults.baseURL}/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })
  assert.equal(
    cors.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  )
  process.stdout.write(
    'Backend real: registro + identidad + logout local + login con la misma cuenta + credenciales incorrectas + JWT inválido + CORS: correctos. Se creó una cuenta ficticia de prueba.\n',
  )
} catch (error) {
  process.stderr.write(`Verificación real fallida: ${error.message}\n`)
  process.exitCode = 1
} finally {
  await server.close()
}

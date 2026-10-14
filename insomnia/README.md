# Pruebas manuales del backend con Insomnia

Colección de [Insomnia](https://insomnia.rest/) para probar a mano la API de TRAMA. Sirve para ver qué responde el backend a cada pedido y para comprobar los permisos con los usuarios ficticios del `DataSeeder`.

Son 35 pedidos en 6 carpetas. Cada uno trae una descripción de qué prueba y qué respuesta esperar, y un test automático que verifica el código HTTP.

> Esta colección **no reemplaza** a los tests de JUnit (`./mvnw test`). Es para explorar la API y ver las respuestas con tus propios ojos.

## Qué necesitás

- **Insomnia 9 o más nuevo.** La colección usa scripts (`preRequestScript` y `afterResponseScript`), que no existen en versiones anteriores.
- **Docker con MySQL levantado:** `docker compose up -d` desde la raíz del repo.
- **El backend corriendo con el perfil `dev`**, que es el que viene por defecto:

  ```bash
  cd demo
  ./mvnw spring-boot:run
  ```

  Con el perfil `dev`, el `DataSeeder` carga los usuarios y proyectos ficticios la primera vez.

## Paso 1: importar la colección

1. Abrí Insomnia.
2. **Import** → **From File** → elegí `insomnia/trama.insomnia.json`.
3. Va a aparecer la colección **TRAMA API (local)**.

## Paso 2: cargar los ids de los niños

Los ids de los proyectos son UUID aleatorios: cambian cada vez que se carga el `DataSeeder`. Por eso hay que copiarlos a mano.

1. Consultá los ids en la base:

   ```bash
   docker exec trama-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" trama -e "SELECT apodo, BIN_TO_UUID(id) AS id FROM proyecto;"'
   ```

   Vas a ver algo así:

   ```
   apodo   id
   Tomi    cc366a25-b215-4354-a3fb-47fb3ddf57b3
   Valen   ...
   Juli    ...
   ```

   También podés usar la extensión **Database Client** de VS Code con `SELECT apodo, BIN_TO_UUID(id) FROM proyecto;`.

2. En Insomnia, abrí el entorno: el selector de entornos arriba a la izquierda → **Manage Environments** → **Base Environment**.
3. Reemplazá los valores `PEGAR-UUID-DE-...` de `proyecto_tomi`, `proyecto_valen` y `proyecto_juli` con los ids reales.

Si vaciás la base y el `DataSeeder` vuelve a cargar los datos, los ids cambian y hay que repetir este paso.

## Paso 3: correr las carpetas en orden

**Siempre empezá por la carpeta 1.** Esa carpeta loguea a todos los usuarios y guarda sus tokens en el entorno. Las demás carpetas usan esos tokens.

Para correr una carpeta entera: clic derecho sobre la carpeta → **Run Folder**, o el botón **Run** del Collection Runner. También podés mandar los pedidos de a uno con `Cmd+Enter` y mirar cada respuesta.

| Carpeta | Qué prueba | Pedidos |
|---|---|---|
| **1. Login (correr primero)** | Login de los 7 usuarios del DataSeeder. Guarda `token_tutor`, `token_familiar`, etc. Errores de login | 10 |
| **2. Registro** | Alta de usuario, email repetido, contraseña débil y datos vacíos | 4 |
| **3. Mi perfil** | `GET /auth/yo` con token, sin token y con un token inventado | 3 |
| **4. Ver un niño** | `GET /proyectos/{id}`: miembros sí, ajenos no, ids inventados y numéricos | 8 |
| **5. Configuración del niño** | `PUT /proyectos/{id}/configuracion`: solo tutores admin | 8 |
| **6. Bloqueo de cuenta** | 5 intentos fallidos bloquean la cuenta 15 minutos | 2 |

## Los usuarios

Todos tienen la contraseña `Trama1234!`.

| Variable del token | Usuario | Tomi | Valen | Juli |
|---|---|---|---|---|
| `token_tutor` | Marta (`tutor@trama.test`) | TUTOR admin | — | — |
| `token_cotutor` | Jorge (`cotutor@trama.test`) | TUTOR admin | — | — |
| `token_familiar` | Elena (`familiar@trama.test`) | FAMILIAR | FAMILIAR | FAMILIAR |
| `token_docente` | María (`docente@trama.test`) | EDUCACION | EDUCACION | EDUCACION |
| `token_psico` | Diego (`psico@trama.test`) | SALUD | SALUD | SALUD (solo lectura, plan gratuito) |
| `token_tutora_valen` | Laura (`tutora.valen@trama.test`) | — | TUTOR admin | — |
| `token_tutor_juli` | Pablo (`tutor.juli@trama.test`) | — | — | TUTOR admin |
| `token_prueba` | El usuario de "Registro exitoso" | — | — | — |

Los tokens duran 8 horas. Si empiezan a responder `401`, volvé a correr la carpeta 1.

## Qué tiene que pasar en cada pedido

Abrí la pestaña **Tests** de la respuesta: cada pedido verifica su código HTTP. Si todo está bien, ves `Responde 200` (o el código que corresponda) en verde.

### 1. Login

| Pedido | Esperado | Por qué |
|---|---|---|
| Login de cada usuario (7) | `200` | Devuelve `access_token`, `id`, `nombre`, `apellido` y `email` |
| Login con email inexistente | `401` | `CREDENCIALES_INVALIDAS`. No suma intentos fallidos a nadie |
| Login con email mal formado | `400` | `@Email` lo rechaza antes de llegar al service |
| Login sin datos | `400` | `@NotBlank` en email y contraseña |

### 2. Registro

| Pedido | Esperado | Por qué |
|---|---|---|
| Registro exitoso | `201` | Un script genera un email nuevo en cada envío y lo guarda en `email_prueba` |
| Registro con email ya usado | `409` | `EMAIL_EN_USO`: `tutor@trama.test` ya existe |
| Registro con contraseña débil | `400` | Pide al menos 8 caracteres, una mayúscula, un número y un carácter especial |
| Registro sin datos | `400` | Todos los campos son obligatorios |

### 3. Mi perfil

| Pedido | Esperado | Por qué |
|---|---|---|
| Mi perfil como Marta | `200` | Nunca incluye la contraseña |
| Mi perfil sin token | `401` | `NO_AUTENTICADO` |
| Mi perfil con token inventado | `401` | La firma no es válida |

### 4. Ver un niño (criterios 3 y 5 del 0.1)

| Pedido | Esperado | Por qué |
|---|---|---|
| Marta ve a Tomi | `200` | Es su tutora |
| Elena (familiar) ve a Tomi | `200` | Cualquier miembro puede ver |
| Diego (psico) ve a Juli | `200` | Puede ver aunque esté en solo lectura |
| **Pablo (ajeno) intenta ver a Tomi** | `403` | **Criterio 3:** no es miembro |
| Usuario sin proyectos intenta ver a Tomi | `403` | Tampoco es miembro |
| Ver a Tomi sin token | `401` | Sin sesión no se ve nada |
| **Ver un UUID inventado** | `403` | **Criterio 5:** responde 403 y no 404, así la API no revela qué niños existen |
| **Ver con id numérico** | `400` | **Criterio 5:** los ids son UUID, nunca 1, 2, 3 |

### 5. Configuración del niño (criterio 4 del 0.1)

| Pedido | Esperado | Por qué |
|---|---|---|
| Marta (tutora admin) cambia la configuración | `200` | Es tutora admin |
| Jorge (co-tutor admin) cambia la configuración | `200` | Un co-tutor con `esAdmin` también puede |
| **Elena, María o Diego intentan cambiarla** | `403` | **Criterio 4:** son miembros, pero no admin |
| Pablo (ajeno) intenta cambiarla | `403` | Es tutor admin, pero de otro niño |
| Marta envía la configuración sin campos | `400` | `@NotNull` en los dos campos |
| Restaurar la configuración original | `200` | Deja `familiarPuedeCargar = true` y `familiarVeNotas = false` |

**Corré siempre "Restaurar" al final**, así Tomi queda como lo cargó el `DataSeeder`.

### 6. Bloqueo de cuenta

1. Primero corré **"Registro exitoso"** (carpeta 2). Crea el usuario que se va a bloquear.
2. Mandá **"Contraseña incorrecta" 5 veces seguidas:**
   - Los intentos 1 a 4 responden `401`.
   - El 5.º responde **`429 CUENTA_BLOQUEADA`**. El test de ese pedido espera `401`, así que en el 5.º intento **va a aparecer en rojo, y eso es lo correcto**.
3. Mandá **"Contraseña correcta con la cuenta bloqueada"**: responde `429`, porque la cuenta queda bloqueada 15 minutos aunque la contraseña sea correcta.

> ⚠️ **Nunca pruebes el bloqueo con un usuario del DataSeeder.** Quedaría bloqueado 15 minutos y no podrías usarlo en las otras carpetas.

## Formato de los errores

Todos los errores tienen el mismo formato, armado por `GlobalExceptionHandler`:

```json
{ "codigo": "ACCESO_DENEGADO", "mensaje": "No tenés permiso para realizar esta acción" }
```

| Código HTTP | `codigo` | Cuándo |
|---|---|---|
| `400` | `DATOS_INVALIDOS` | Falta un campo, el formato es inválido o el id no es un UUID |
| `401` | `NO_AUTENTICADO` / `CREDENCIALES_INVALIDAS` | Sin token, token inválido, o email o contraseña incorrectos |
| `403` | `ACCESO_DENEGADO` | Hay sesión, pero no hay permiso sobre ese niño |
| `409` | `EMAIL_EN_USO` | Registro con un email que ya existe |
| `429` | `CUENTA_BLOQUEADA` | 5 intentos fallidos seguidos |

## Limpiar los usuarios de prueba

Cada "Registro exitoso" crea un usuario `prueba.<número>@trama.test` en tu base de desarrollo. Para borrarlos:

```bash
docker exec trama-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" trama -e "DELETE FROM usuario WHERE email LIKE \"prueba.%@trama.test\";"'
```

## Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| Todo responde `401` | Los tokens están vacíos o vencidos | Correr la carpeta 1 |
| Los pedidos de proyectos responden `400` | `proyecto_tomi` todavía dice `PEGAR-UUID-DE-TOMI` | Hacer el paso 2 |
| Los pedidos de proyectos responden `403` con Marta | Los ids cambiaron porque se recargó el DataSeeder | Repetir el paso 2 |
| `Error: Couldn't connect to server` | El backend no está corriendo | `cd demo && ./mvnw spring-boot:run` |
| Login de un usuario mock responde `429` | Quedó bloqueado por intentos fallidos | Esperar 15 minutos |
| Los scripts no hacen nada | Insomnia es anterior a la versión 9 | Actualizar Insomnia |

## Cuando se agreguen endpoints nuevos

Sumá los pedidos a la colección desde Insomnia y después exportala: clic derecho en la colección → **Export** → formato **Insomnia v4 (JSON)**, y guardala sobre `insomnia/trama.insomnia.json`. Agregá también su fila en las tablas de este README.

# Pendientes para Startup

Lista de lo que falta para que TRAMA pase de MVP a producto, armada como cards de Trello.
Fuentes: revisión del stack sobre `develop` (17/11/2026) y el informe de pruebas de la rama `testing`
(`docs/testing/2026-11-06/`, pruebas del 5 y 6 de noviembre). Todos los hallazgos se verificaron contra `develop`.

**Cómo leer cada card**

- **Etiquetas:** Back · Front · Infra · Seguridad · BD · Docs
- **Prioridad:** 🔴 Antes de producción · 🟠 Pronto · 🔵 Decidir con el equipo
- **Tamaño:** S (1 archivo o configuración) · M (varios archivos y sus tests) · L (cambia la API, el esquema o varias capas)
- Toda card que toca código se cierra con `./mvnw test` y/o `npm test` y `npm run lint` en verde, y con un test de acceso denegado (`403`) si toca permisos.

## Equipo y roles

Los responsables salen de quién hizo cada parte, según los PRs mergeados en `develop`. Cada card tiene un **responsable**, que la lleva y abre el PR, y un **apoyo**, que conoce esa parte, revisa o mide el resultado.

| Persona | Rol en el proyecto | Lo que ya hizo y por eso conoce |
|---|---|---|
| Ana Merlini | Referente de back (aprueba dependencias del back) | Base inicial, aportes genéricos (3.0, 3.1), bitácora, calendario, notificaciones, backups diarios (#86) |
| Zoe Preiti | Referente de front (aprueba dependencias del front) | Base del front y autenticación (#15), portada, comunicación, perfil sensorial |
| Sofia Piron | Diseño: guía de estilo y mockups | Guía de estilo (0.15), mockups, desregulación (2.5), preguntas guía |
| Lucas Vardé | Datos, seguridad e infraestructura | Modelo de datos, cifrado (0.20), OpenBao y backups (0.3), auditoría (0.2), registro de accesos (8.0), pruebas de carga (rama `testing`) |
| Santiago Gonzalez | Integración back y front, autenticación y demo | Recuperar contraseña (1.11), tipo de cuenta (9.4), avisos por mail (6.1), demo (#74), hooks y checkpoints |
| Máximo Vendramini | Front | Arquitectura base del front (0.14), bitácora y filtros, archivos (4.3), calendario (5.0, 5.1, 5.5), Conocelo en 5 minutos (2.8) |
| Tiziana Cócaro | CI, despliegue y back | GitHub Actions, git hooks, despliegue local (0.6), invitaciones, adjuntos en el back (4.2, 4.3), comentarios (6.2) |

## Resumen

| # | Card | Etiquetas | Prioridad | Tamaño | Responsable |
|---|---|---|---|---|---|
| P1 | Paginar aportes y bitácora | Back · Front · BD | 🔴 | L | Ana (back) y Máximo (front) |
| P2 | Archivos por partes (streaming) | Back | 🔴 | M | Tiziana |
| P3 | Que un disco lleno no tire TRAMA | Infra | 🔴 | S | Lucas |
| P4 | Rotación de backups | Infra | 🔴 | S | Lucas |
| P5 | Puertos solo en localhost | Infra · Seguridad | 🔴 | S | Lucas |
| P6 | Demo pública sin cuentas fijas | Infra · Seguridad | 🔴 | S | Santiago |
| P7 | Actualizar Spring Boot | Back · Seguridad | 🔴 | L | Ana |
| P8 | CORS por variable de entorno | Back · Infra | 🔴 | S | Santiago |
| P9 | Apagar Open Session In View | Back | 🟠 | M | Ana |
| P10 | Límite de pedidos por IP en `/api/auth` | Infra · Seguridad | 🟠 | M | Santiago |
| P11 | Registrar en el log los errores 500 | Back | 🟠 | S | Ana |
| P12 | 409 en vez de 500 ante conflictos | Back | 🟠 | M | Ana |
| P13 | Cortar sesiones al cambiar la contraseña | Back · Seguridad | 🟠 | M | Santiago |
| P14 | Largo máximo de contraseña (72 bytes) | Back · Seguridad | 🟠 | S | Tiziana |
| P15 | Filtro JWT más liviano | Back | 🟠 | S | Santiago |
| P16 | Que no se pueda saber si un email tiene cuenta | Back · Seguridad | 🟠 | M | Santiago |
| P17 | Mails en segundo plano | Back | 🟠 | M | Tiziana |
| P18 | Validar el tipo real de los archivos | Back · Seguridad | 🟠 | S | Tiziana |
| P19 | Endurecer contenedores y nginx | Infra · Seguridad | 🟠 | M | Tiziana |
| P20 | Bloqueo optimista y cupos con bloqueo | Back · BD | 🟠 | M | Lucas |
| P21 | Todos los secretos en OpenBao | Infra · Seguridad | 🟠 | M | Lucas |
| P22 | Archivos huérfanos en disco | Back | 🟠 | S | Tiziana |
| P23 | Cifrar el título del aporte y los datos del niño | BD · Seguridad | 🔵 | L | Lucas |
| P24 | Limpiar normalización | BD | 🔵 | M | Lucas |
| P25 | Token en cookie HttpOnly | Back · Front · Seguridad | 🔵 | L | Zoe (front) |
| P26 | Más de una copia del backend | Back · Infra | 🔵 | L | Ana |
| P27 | Réplica y recuperación a un momento | Infra · BD | 🔵 | L | Lucas |
| P28 | Pantalla de registro de accesos | Front | 🔵 | M | Zoe |
| P29 | Documentación al día con el stack | Docs | 🟠 | S | Santiago |
| P30 | Segunda ronda de pruebas | Infra | 🔵 | M | Lucas |

---

## 🔴 Antes de producción

### P1 · Paginar aportes y bitácora

`Back` `Front` `BD` · Tamaño L

**Responsable:** Ana (back) y Máximo (front) · **Apoyo:** Sofía (mockup de "cargar más"), Lucas (repetir la prueba)

**Descripción**
`GET /aportes` y `GET /bitacora` traen todos los aportes del niño, descifran cada texto y hacen una consulta extra por aporte para los adjuntos (N+1). Con 1.000 aportes por niño (menos de un año de uso), abrir un perfil tarda 3,7 s en un VPS de 1 CPU · 2 GB. Con 20.000, el backend deja de responder. Es el límite real de TRAMA: no depende de la cantidad de usuarios, depende de cuántos aportes tiene cada niño.

**Criterios de aceptación**
- [ ] `GET /aportes` y `GET /bitacora` aceptan `page` y `size` (máximo 50) y devuelven el total.
- [ ] Los adjuntos de una página se traen en una sola consulta.
- [ ] La visibilidad se sigue filtrando en la consulta a la base.
- [ ] El front carga más al hacer scroll o con un botón, sin perder filtros.
- [ ] "Conocelo en 5 minutos" y la exportación (8.1, 8.3, 8.4) siguen trayendo todo lo que necesitan.
- [ ] Con 1.000 aportes, abrir el perfil tarda menos de 500 ms (p95, 20 personas, 1 CPU · 2 GB).

**Entregables**
- Cambios en `AporteController`, `AporteService`, `AporteRepository` y `api/aportes.js`.
- Tests: caso bueno, página fuera de rango y `403`.
- La prueba "niño con muchos aportes" repetida, con el resultado agregado a `docs/testing/`.

**Referencia:** `docs/testing/2026-11-06/casos-limite.md#niños-con-muchos-aportes` (hallazgo 1)

### P2 · Archivos por partes (streaming)

`Back` · Tamaño M

**Responsable:** Tiziana · **Apoyo:** Lucas (cifrado por bloques)

**Descripción**
`ArchivoService` lee y escribe cada archivo entero en memoria. Después de un pico de uso, Java agota la memoria directa, y entre el 26 % y el 75 % de las subidas y descargas fallan con `500` hasta reiniciar.

**Criterios de aceptación**
- [ ] Paliativo inmediato: `-Djdk.nio.maxCachedBufferSize=262144` en las opciones de Java del contenedor.
- [ ] Cifrar y descifrar por bloques con `CipherInputStream`/`CipherOutputStream`, sin cargar el archivo entero.
- [ ] Con 50 personas subiendo y bajando archivos de 5 MB, 0 % de errores.

**Entregables**
- `ArchivoService` y `CryptoService` adaptados, y el Dockerfile o compose con la opción de Java.
- Test de un archivo de 5 MB: sube, baja y el contenido coincide.

**Referencia:** `casos-limite.md#archivos-adjuntos` (hallazgo 2)

### P3 · Que un disco lleno no tire TRAMA

`Infra` · Tamaño S

**Responsable:** Lucas · **Apoyo:** Santiago (compose)

**Descripción**
Con el disco lleno, MySQL se queda esperando espacio, se agotan las conexiones y TRAMA no se recupera sola. Hoy los logs de Docker y los binlogs de MySQL crecen sin límite.

**Criterios de aceptación**
- [ ] Rotación de logs en cada servicio del compose (`max-size: "10m"`, `max-file: "5"`).
- [ ] `binlog_expire_logs_seconds` con menos retención, o binlogs apagados mientras no haya réplica.
- [ ] Alerta cuando el disco pasa el 80 %. Puede ser un script con cron que mande un mail.

**Entregables**
- `docker-compose.yml` actualizado y el script de alerta en el repo.
- Una línea en el README que explique cómo funciona la alerta.

**Referencia:** `casos-limite.md#disco-lleno`, `seguridad.md` D3 (hallazgo 3)

### P4 · Rotación de backups

`Infra` · Tamaño S

**Responsable:** Lucas · **Apoyo:** Ana (backups diarios, #86)

**Descripción**
`backup.sh` no borra backups viejos, y cada backup copia todos los adjuntos. Con 7 backups en el mismo disco, la capacidad de 50 GB baja de unos 1.150 a unos 150 niño-años.

**Criterios de aceptación**
- [ ] Quedan solo los últimos 7 backups y se borran los más viejos.
- [ ] Los backups se pueden copiar fuera del servidor (otro disco o almacenamiento externo).
- [ ] `restaurar.sh` sigue funcionando con el backup más reciente.

**Entregables**
- `backup/backup.sh` actualizado.
- Prueba documentada: se corren 9 backups y quedan 7, y se restaura el último.

**Referencia:** `capacidad-50gb.md#backups`, `seguridad.md` D6 (hallazgo 4)

### P5 · Puertos solo en localhost

`Infra` `Seguridad` · Tamaño S

**Responsable:** Lucas · **Apoyo:** Tiziana (despliegue local, 0.6)

**Descripción**
El compose publica MySQL (`3307`) y el backend (`4002`) en todas las interfaces. En un VPS quedarían abiertos a internet, porque Docker se saltea `ufw`.

**Criterios de aceptación**
- [ ] `"127.0.0.1:3307:3306"` y `"127.0.0.1:4002:8080"`, como ya tienen Mailpit, OpenBao y la demo.
- [ ] Desde otra máquina, `nc` a esos puertos falla.

**Entregables**
- 2 líneas de `docker-compose.yml`.

**Referencia:** `seguridad.md` D1 (hallazgo 6)

### P6 · Demo pública sin cuentas fijas

`Infra` `Seguridad` · Tamaño S

**Responsable:** Santiago · **Apoyo:** Lucas (verificar el 401)

**Descripción**
`backend-demo` corre con el perfil `dev`, que activa `DataSeeder` y crea cuentas como `tutor@trama.test` con una contraseña fija conocida. La demo está publicada con ngrok, así que cualquiera puede entrar.

**Criterios de aceptación**
- [ ] La demo usa un perfil propio, o `DataSeeder` corre solo si se activa una variable explícita.
- [ ] El login con las cuentas fijas en la demo responde `401`.
- [ ] Coordinado con quien mantiene la demo (#74).

**Entregables**
- Compose y `DataSeeder` actualizados.
- Cómo crear las cuentas de la demo, documentado sin la contraseña.

**Referencia:** `seguridad.md` D2 (hallazgo 7)

### P7 · Actualizar Spring Boot

`Back` `Seguridad` · Tamaño L

**Responsable:** Ana · **Apoyo:** Lucas (Trivy y prueba de carga), Tiziana (CI)

**Descripción**
Spring Boot 3.1.11 ya no tiene soporte gratuito. Trivy encontró 13 vulnerabilidades críticas en la imagen del backend (Tomcat 10.1.20, Spring 6.0/6.1). Algunas aplican directamente, como BCrypt de 72 bytes y DoS en subidas.

**Criterios de aceptación**
- [ ] Spring Boot en una versión 3.x con soporte, con la línea de Spring Cloud compatible (hoy 2022.0.5).
- [ ] Trivy sobre la imagen nueva: 0 vulnerabilidades críticas que apliquen.
- [ ] La suite completa del back en verde y la prueba de carga repetida.

**Entregables**
- Rama propia con `pom.xml` actualizado y lo que haya que ajustar.
- El informe de Trivy de antes y de después, en `docs/testing/`.

**Referencia:** `seguridad.md#dependencias-trivy` (hallazgo 8)

### P8 · CORS por variable de entorno

`Back` `Infra` · Tamaño S

**Responsable:** Santiago · **Apoyo:** Zoe (probar desde el front)

**Descripción**
`CorsConfig` permite un solo origen, `http://localhost:5173`, escrito en el código. Con un dominio propio, el front no podría llamar a la API salvo que vaya por el mismo dominio.

**Criterios de aceptación**
- [ ] Los orígenes salen de una variable de entorno, por ejemplo `CORS_ORIGENES`, con `http://localhost:5173` como valor por defecto en dev.
- [ ] Un origen no permitido recibe la respuesta sin cabeceras CORS.

**Entregables**
- `CorsConfig`, `application-*.yml` y `.env.example` actualizados.
- Test de origen permitido y de origen rechazado.

---

## 🟠 Pronto

### P9 · Apagar Open Session In View

`Back` · Tamaño M

**Responsable:** Ana · **Apoyo:** Lucas (medir antes y después)

**Descripción**
Open Session In View viene activado por defecto en Spring y TRAMA no lo apaga. Por eso el login retiene una de las 10 conexiones a la base mientras calcula BCrypt. Con la CPU ocupada, las conexiones se agotan y todos los pedidos hacen cola hasta 30 s.

**Criterios de aceptación**
- [ ] `spring.jpa.open-in-view=false`.
- [ ] Ningún service lee relaciones lazy fuera de su transacción: la suite completa pasa.

**Entregables**
- 1 línea de configuración y los ajustes en los services que fallen.

**Referencia:** `rendimiento.md#qué-satura-a-trama` (hallazgo 5)

### P10 · Límite de pedidos por IP en `/api/auth`

`Infra` `Seguridad` · Tamaño M

**Responsable:** Santiago · **Apoyo:** Lucas (tormenta de logins)

**Descripción**
Login, registro y recuperación no tienen límite. Con 80 logins por segundo, el backend dejó de responder. Además, cualquiera puede bloquear la cuenta de otra persona con 5 intentos, o mandar mails sin freno y agotar el cupo de Gmail.

**Criterios de aceptación**
- [ ] `limit_req` en nginx para `/api/auth/*`, sin dependencias nuevas.
- [ ] Al pasar el límite, la respuesta es `429` con `{codigo, mensaje}`, y el backend sigue respondiendo al resto.

**Entregables**
- `nginx.conf.template` actualizado.
- La prueba de tormenta de logins repetida.

**Referencia:** `seguridad.md` C2 (hallazgo 11)

### P11 · Registrar en el log los errores 500

`Back` · Tamaño S

**Responsable:** Ana · **Apoyo:** Santiago

**Descripción**
`GlobalExceptionHandler.handleUnexpected` devuelve `500` sin escribir la excepción en el log. Por eso 806 errores de memoria en las subidas solo se vieron con Java Flight Recorder.

**Criterios de aceptación**
- [ ] La excepción queda en el log con el stack trace, sin contenido de aportes ni datos del niño.
- [ ] La respuesta al usuario no cambia.

**Entregables**
- `GlobalExceptionHandler` y un test que fuerza un error y verifica el log.

**Referencia:** `seguridad.md` C3 (hallazgo 10)

### P12 · 409 en vez de 500 ante conflictos

`Back` · Tamaño M

**Responsable:** Ana · **Apoyo:** Máximo (mensaje en el front)

**Descripción**
Dos ediciones simultáneas del mismo aporte producen un deadlock en MySQL, y la persona recibe un `500`. Con 10 ediciones a la vez, falla el 61 %, aunque no se pierden datos. Pasa lo mismo con un choque de `UNIQUE` (`DataIntegrityViolationException`).

**Criterios de aceptación**
- [ ] Un deadlock o un choque de `UNIQUE` responde `409` con un mensaje claro, por ejemplo "Alguien guardó este aporte al mismo tiempo. Volvé a intentarlo".
- [ ] El front muestra el mensaje y no "Ocurrió un error inesperado".

**Entregables**
- Handlers nuevos en `GlobalExceptionHandler` y su test.

**Referencia:** `casos-limite.md#ediciones-simultáneas` (hallazgo 9)

### P13 · Cortar sesiones al cambiar la contraseña

`Back` `Seguridad` · Tamaño M

**Responsable:** Santiago · **Apoyo:** Zoe (cierre de sesión en el front)

**Descripción**
Un JWT vale 8 h aunque se cambie la contraseña. La columna `usuario.token_version` existe, pero `JwtService` no la incluye en el token y el filtro no la compara.

**Criterios de aceptación**
- [ ] El token lleva la versión, y `JwtAuthenticationFilter` rechaza con `401` un token con una versión vieja.
- [ ] Restablecer o cambiar la contraseña incrementa la versión.

**Entregables**
- `JwtService`, `JwtAuthenticationFilter` y los services de contraseña actualizados.
- Test: con el token de antes del cambio, la respuesta es `401`.

**Referencia:** `seguridad.md` C5

### P14 · Largo máximo de contraseña (72 bytes)

`Back` `Seguridad` · Tamaño S

**Responsable:** Tiziana · **Apoyo:** Santiago (revisa)

**Descripción**
BCrypt solo compara los primeros 72 bytes (CVE-2025-22228). Una letra con tilde ocupa 2 bytes.

**Criterios de aceptación**
- [ ] `RegisterRequest` y `RestablecerContrasenaRequest` rechazan con `400` una contraseña de más de 72 bytes.
- [ ] El mensaje de error está en español y es claro.

**Entregables**
- 2 DTOs y sus tests.

**Referencia:** `seguridad.md` C6

### P15 · Filtro JWT más liviano

`Back` · Tamaño S

**Responsable:** Santiago · **Apoyo:** Lucas (medir CPU)

**Descripción**
El filtro valida el token tres veces y busca al usuario en la base en cada pedido. Eso es entre el 11 % y el 24 % de la CPU de cada pedido.

**Criterios de aceptación**
- [ ] La firma se valida una sola vez por pedido.
- [ ] Se sigue verificando que la cuenta esté habilitada y no bloqueada.

**Entregables**
- `JwtService` y `JwtAuthenticationFilter`. Los tests de autenticación pasan igual.

**Referencia:** `rendimiento.md`

### P16 · Que no se pueda saber si un email tiene cuenta

`Back` `Seguridad` · Tamaño M

**Responsable:** Santiago · **Apoyo:** Lucas (medir tiempos)

**Descripción**
El login tarda 91 ms si el email existe y 5 ms si no existe. Además, `CUENTA_BLOQUEADA` aparece solo para emails registrados.

**Criterios de aceptación**
- [ ] Con un email inexistente también se calcula BCrypt contra un hash fijo.
- [ ] Una cuenta bloqueada y una inexistente reciben el mismo mensaje.
- [ ] 20 logins con emails existentes y 20 con inexistentes dan tiempos medianos parecidos.

**Entregables**
- `AuthenticationService` y `LoginAttemptService`, con sus tests.

**Referencia:** `seguridad.md` C1

### P17 · Mails en segundo plano

`Back` · Tamaño M

**Responsable:** Tiziana · **Apoyo:** Santiago (avisos por mail, 6.1)

**Descripción**
No hay `@Async`. Registro, invitaciones, recuperación y avisos esperan a que responda Gmail, con la conexión a la base retenida.

**Criterios de aceptación**
- [ ] `EmailService` envía de forma asíncrona, después de que se confirma la transacción.
- [ ] Si un envío falla, queda en el log y el pedido del usuario no falla.

**Entregables**
- Configuración de `@EnableAsync` y `EmailService` actualizado, con sus tests.

**Referencia:** `seguridad.md` C9

### P18 · Validar el tipo real de los archivos

`Back` `Seguridad` · Tamaño S

**Responsable:** Tiziana · **Apoyo:** Santiago (foto de perfil)

**Descripción**
`ArchivoService` confía en la extensión y en el `Content-Type` que manda el navegador. Además, la foto de perfil se sirve sin `X-Content-Type-Options: nosniff`. El comprobante de matrícula ya la tiene.

**Criterios de aceptación**
- [ ] Se validan los primeros bytes del archivo (PNG, JPEG o PDF). Un archivo renombrado responde `400`.
- [ ] La foto de perfil se sirve con `nosniff`.

**Entregables**
- `ArchivoService` y `CuentaController`, con sus tests.

**Referencia:** `seguridad.md` C8

### P19 · Endurecer contenedores y nginx

`Infra` `Seguridad` · Tamaño M

**Responsable:** Tiziana · **Apoyo:** Lucas

**Descripción**
Los contenedores del back y del front corren como root. nginx no manda cabeceras de seguridad y muestra su versión. Mailpit y ngrok usan la imagen `:latest`.

**Criterios de aceptación**
- [ ] Los Dockerfiles usan `USER` sin privilegios.
- [ ] nginx manda `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` y `server_tokens off`.
- [ ] Todas las imágenes del compose tienen la versión fija.

**Entregables**
- Dockerfiles, `nginx.conf.template` y `docker-compose.yml` actualizados.

**Referencia:** `seguridad.md` D4 y D5

### P20 · Bloqueo optimista y cupos con bloqueo

`Back` `BD` · Tamaño M

**Responsable:** Lucas · **Apoyo:** Santiago (cupos de institución, 9.x)

**Descripción**
`aporte` no tiene `@Version`: si se edita dos veces a la vez, gana la última. Los cupos de institución se controlan sin bloquear, así que dos altas simultáneas pueden pasar el límite por uno.

**Criterios de aceptación**
- [ ] `@Version` en `Aporte`, con una migración Flyway nueva. Un conflicto responde `409`, igual que en P12.
- [ ] El control de cupos de `InstitucionService` bloquea la fila de la institución.

**Entregables**
- La migración, la entidad, el service y un test de concurrencia de cada caso.

### P21 · Todos los secretos en OpenBao

`Infra` `Seguridad` · Tamaño M

**Responsable:** Lucas · **Apoyo:** Santiago (JWT y mail)

**Descripción**
OpenBao guarda solo `TRAMA_CRYPTO_KEY` y `TRAMA_BACKUP_KEY`. `JWT_SECRET`, las contraseñas de la base y del SMTP siguen en el `.env`. En local, OpenBao corre sin TLS.

**Criterios de aceptación**
- [ ] `JWT_SECRET` y `SPRING_MAIL_PASSWORD` en `secret/trama`, leídos por el perfil `prod`.
- [ ] OpenBao con TLS en producción, y la clave de apertura fuera de cualquier archivo del servidor.

**Entregables**
- `openbao/inicializar.sh`, `application-prod.yml` y `docs/plan-openbao.md` actualizados.

### P22 · Archivos huérfanos en disco

`Back` · Tamaño S

**Responsable:** Tiziana · **Apoyo:** Lucas

**Descripción**
El archivo cifrado se escribe en disco antes de guardar su fila. Si falla el guardado en la base, el archivo queda en disco sin referencia.

**Criterios de aceptación**
- [ ] Si la transacción falla, el archivo se borra del disco (hook de rollback o el orden invertido).
- [ ] Test que fuerza el fallo y verifica que no queda el archivo.

**Entregables**
- `ArchivoService` y su test.

### P29 · Documentación al día con el stack

`Docs` · Tamaño S

**Responsable:** Santiago · **Apoyo:** Ana y Zoe (aprueban dependencias)

**Descripción**
`CONTEXTO.md` y `HERRAMIENTAS.md` dicen que hay Prettier, Husky y lint-staged, pero no están instalados. `HERRAMIENTAS.md` además dice que las migraciones van de V1 a V6 y que el front está "planificado".

**Criterios de aceptación**
- [ ] El equipo decide si se instalan Prettier, Husky y lint-staged (es una dependencia nueva, necesita aprobación) o si se sacan de la documentación.
- [ ] `HERRAMIENTAS.md` lista las herramientas reales: OpenBao, OpenPDF, nginx, ngrok, Phosphor, react-easy-crop, check-estilos y las herramientas de testing.

**Entregables**
- `CONTEXTO.md` y `HERRAMIENTAS.md` actualizados.

---

## 🔵 Decidir con el equipo

### P23 · Cifrar el título del aporte y los datos del niño

`BD` `Seguridad` · Tamaño L

**Responsable:** Lucas · **Apoyo:** Ana (aprueba el cambio de esquema)

**Descripción**
`aporte.titulo` y `aporte_version.titulo` se guardan sin cifrar, pero un título como "Crisis en el recreo" es texto libre sobre el niño. Lo mismo pasa con nombre, apellido, fecha de nacimiento y escuela en `proyecto`.

**Criterios de aceptación**
- [ ] Decisión del equipo sobre qué campos se cifran, sabiendo que no se podrá buscar con SQL sobre ellos.
- [ ] Migración Flyway nueva que cambia el tipo de las columnas, y una migración de datos que cifra lo existente.
- [ ] Las búsquedas y los ordenamientos por esos campos pasan al service.

**Entregables**
- Las migraciones, las entidades con `CifradoConverter`, los ajustes en los services y sus tests.

**Referencia:** `seguridad.md` C4 (hallazgo 12)

### P24 · Limpiar normalización

`BD` · Tamaño M

**Responsable:** Lucas · **Apoyo:** Santiago (tipo de cuenta, 9.4)

**Descripción**
Quedan dos restos de cambios anteriores:
- `membresia.matricula`: ningún service la escribe, pero `MiembroResponse` la prefiere antes que `usuario.matricula`. Rompe la 2FN.
- Las especialidades están en `membresia_especialidad` y en `usuario_especialidad`.

**Criterios de aceptación**
- [ ] Una migración copia las matrículas a `usuario` y elimina `membresia.matricula`.
- [ ] El equipo decide si la especialidad es por niño o por persona. Si es por persona, se unifica en una tabla.

**Entregables**
- Las migraciones, las entidades, `MiembroResponse` y sus tests.

### P25 · Token en cookie HttpOnly

`Back` `Front` `Seguridad` · Tamaño L

**Responsable:** Zoe (front) · **Apoyo:** Santiago (back)

**Descripción**
El JWT vive en `sessionStorage` o `localStorage`, así que un XSS podría leerlo. React escapa el texto y no hay `dangerouslySetInnerHTML`, pero la solución de fondo es una cookie.

**Criterios de aceptación**
- [ ] El token viaja en una cookie `HttpOnly`, `Secure` y `SameSite=Strict`.
- [ ] CSRF se vuelve a activar en Spring Security.
- [ ] `api/cliente.js` deja de guardar el token.

**Entregables**
- `SecurityConfig`, `AuthenticationController` y `cliente.js` actualizados, con los tests de login y de cierre de sesión.

### P26 · Más de una copia del backend

`Back` `Infra` · Tamaño L

**Responsable:** Ana · **Apoyo:** Lucas

**Descripción**
Hoy no se puede correr más de una copia: los archivos están en el disco local, y las tareas programadas (avisos a las 8:00 y eliminación a las 3:00) correrían una vez por copia. Con el doble de CPU, el rendimiento sube solo entre 66 % y 74 %.

**Criterios de aceptación**
- [ ] Los archivos se guardan en almacenamiento compartido, por ejemplo S3 compatible.
- [ ] Las tareas programadas corren una sola vez, con ShedLock o un lock en la base.

**Entregables**
- Diseño acordado y PRs separados para archivos y tareas.

**Referencia:** `docs/testing/2026-11-06/escalabilidad.md`

### P27 · Réplica y recuperación a un momento

`Infra` `BD` · Tamaño L

**Responsable:** Lucas · **Apoyo:** Ana

**Descripción**
Hay una sola base y un solo servidor. Si se cae, se pierde lo cargado desde el último backup.

**Criterios de aceptación**
- [ ] Una réplica de MySQL, o binlogs guardados fuera del servidor para recuperar hasta un momento exacto.
- [ ] Un simulacro de recuperación documentado, con el tiempo que llevó.

**Entregables**
- Configuración, scripts y la guía de recuperación.

### P28 · Pantalla de registro de accesos

`Front` · Tamaño M

**Responsable:** Zoe · **Apoyo:** Sofía (mockup), Lucas (endpoint 8.0)

**Descripción**
`GET /api/proyectos/{id}/registro-accesos` (8.0) existe y solo lo ve un tutor, pero no tiene pantalla. Hoy se prueba con Insomnia.

**Criterios de aceptación**
- [ ] Una pantalla para tutores, con quién entró y qué hizo, y filtro por miembro.
- [ ] Respeta el mockup de Sofía y usa los componentes de `components/ui/`.

**Entregables**
- Una página en `features/`, `api/registroAccesos.js` y sus tests.

### P30 · Segunda ronda de pruebas

`Infra` · Tamaño M

**Responsable:** Lucas · **Apoyo:** Ana

**Descripción**
La primera ronda no probó invitaciones, acuerdos, eventos ni mails reales, y corrió sin red ni HTTPS en una Mac. Cada prueba se hizo una sola vez, y puede haber una variación de ±10 % entre corridas.

**Criterios de aceptación**
- [ ] Se repite la escalera de carga después de P1, P7 y P9.
- [ ] Se suman los flujos que faltaron y una corrida en un VPS real.

**Entregables**
- Una carpeta nueva en `docs/testing/` con el mismo formato que `2026-11-06/`.

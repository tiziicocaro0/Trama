# Herramientas de TRAMA

Qué herramientas usamos, para qué sirve cada una en el proyecto y dónde se ven en el código.
Para las reglas de negocio y la estructura, ver `CONTEXTO.md`.

## Backend (`backend/`)

### Java 21 + Spring Boot 3

- **Qué es:** Spring Boot es el framework que arma la aplicación web en Java. Levanta el servidor, conecta las piezas entre sí (inyección de dependencias) y trae configuraciones listas.
- **Para qué lo usamos:** es la base de todo el backend. Cada clase marcada con `@Service`, `@RestController`, `@Repository` o `@Component` la crea y la conecta Spring.
- **Dónde está:** `backend/pom.xml` (padre `spring-boot-starter-parent`) y `DemoApplication.java`.

### Maven (`./mvnw`)

- **Qué es:** el gestor de dependencias y de compilación de Java.
- **Para qué lo usamos:** descarga las librerías del `pom.xml`, compila, corre los tests y levanta la app. `mvnw` es un "wrapper": baja la versión correcta de Maven, así nadie tiene que instalarla.
- **Comandos:** `./mvnw spring-boot:run` (levantar) y `./mvnw test` (tests).

### Spring Web

- **Qué es:** la parte de Spring que atiende pedidos HTTP.
- **Para qué lo usamos:** los controladores (`@RestController`) reciben los pedidos a `/api/...`, llaman al service y devuelven JSON.
- **Dónde está:** `controllers/` (por ahora, `AuthenticationController`).

### MySQL 8

- **Qué es:** la base de datos relacional.
- **Para qué lo usamos:** guarda usuarios, proyectos, membresías, aportes, eventos, etc. Corre en Docker en cada máquina (ver Docker Compose).
- **Dónde está:** conexión en `application-dev.yml`, `application-test.yml` y `application-prod.yml`.

### Spring Data JPA + Hibernate

- **Qué es:** JPA es la forma estándar de Java de mapear tablas a clases. Hibernate es la implementación que hace el trabajo. Spring Data genera las consultas a partir del nombre del método.
- **Para qué lo usamos:**
  - Las **entidades** (`entity/`) representan las tablas: `Usuario`, `Proyecto`, `Membresia`...
  - Los **repositorios** (`repository/`) hacen las consultas sin escribir SQL. Por ejemplo, `findByUsuarioIdAndProyectoId(...)` en `MembresiaRepository` se traduce solo a un `SELECT ... WHERE`.
- **Importante:** `ddl-auto=validate`. Hibernate **no crea ni modifica tablas**, solo comprueba que las entidades coincidan con la base. Las tablas las crea Flyway.

### Flyway (migraciones)

- **Qué es:** una herramienta que versiona el esquema de la base. Cada cambio en la estructura (crear tabla, agregar columna) es un archivo `.sql` numerado que se ejecuta una sola vez, en orden.
- **Para qué lo usamos:**
  - Al arrancar la app, Flyway mira qué migraciones ya se aplicaron (lo anota en la tabla `flyway_schema_history`) y corre solo las nuevas.
  - Así las 7 personas del equipo, el CI y producción tienen **exactamente la misma base**, sin pasarse scripts a mano.
- **Dónde está:** `backend/src/main/resources/db/migration/` (hoy, de `V1` a `V6`).
- **Reglas:**
  - Archivo nuevo con el formato `V<AAAAMMDDHHMM>__descripcion.sql` (ej. `V202610071530__crear_tabla_aporte.sql`).
  - **Nunca se edita una migración que ya está en `develop`.** Flyway guarda un checksum de cada archivo y, si cambia, la app no arranca. Para corregir algo se crea una migración nueva.

### Spring Security + JWT (jjwt) + BCrypt

- **Qué es:**
  - **Spring Security** controla quién puede entrar a cada ruta.
  - **JWT** (JSON Web Token) es un "pase" firmado que el backend le da al usuario al loguearse. La librería que lo genera y valida es `jjwt`.
  - **BCrypt** es el algoritmo con el que se guardan las contraseñas (hash, nunca en texto plano).
- **Para qué lo usamos:**
  1. El usuario hace `POST /api/auth/login` y recibe un token.
  2. En cada pedido siguiente manda `Authorization: Bearer <token>`.
  3. `JwtAuthenticationFilter` valida el token y carga el usuario. Sin token válido, la respuesta es `401`.
  4. Dentro de los services, `PermisoService` verifica si ese usuario tiene permiso sobre el proyecto. Si no lo tiene, la respuesta es `403`.
- **Dónde está:** `config/SecurityConfig.java`, `config/JwtService.java`, `config/JwtAuthenticationFilter.java` y `service/PermisoService.java`.
- **Importante:** la clave de firma va en la variable de entorno `JWT_SECRET`, nunca en el código.

### Bean Validation (Jakarta Validation)

- **Qué es:** validaciones declarativas con anotaciones.
- **Para qué lo usamos:** chequear los datos que llegan antes de procesarlos (`@NotBlank`, `@Email`, `@Size`...). Si algo no cumple, se responde `400` automáticamente.
- **Dónde está:** en los DTOs de entrada, como `RegisterRequest`, y con `@Valid` en el controlador.

### Lombok

- **Qué es:** una librería que genera código repetitivo al compilar.
- **Para qué lo usamos:** no escribir a mano getters, setters y constructores. Solo usamos `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` y `@RequiredArgsConstructor`.

### Spring Boot Actuator y DevTools

- **Actuator:** expone información de estado de la app (por ejemplo, si está viva).
- **DevTools:** reinicia la app sola cuando cambia el código, solo en desarrollo.

## Tests del backend

Todo viene incluido en `spring-boot-starter-test`.

### JUnit 5

- **Qué es:** el framework base de tests en Java.
- **Para qué lo usamos:** cada método con `@Test` es un caso de prueba. Se corren con `./mvnw test`, y también en el hook `pre-push` y en el CI.

### Mockito

- **Qué es:** una librería para crear **objetos falsos ("mocks")** que reemplazan a las dependencias reales de una clase.
- **Para qué lo usamos:** probar la lógica de un service **aislado**, sin base de datos ni login. Por ejemplo, para probar `PermisoService`:
  - Se simula `UsuarioActual` para que devuelva un id fijo.
  - Se simula `MembresiaRepository` para que diga "es miembro" o "no es miembro".
  - Se verifica que el service lance `AccessDeniedException` (que termina en un `403`) cuando corresponde.
- **Piezas principales:**

  | Pieza | Qué hace |
  |---|---|
  | `@ExtendWith(MockitoExtension.class)` | Activa Mockito en la clase de test |
  | `@Mock` | Crea una dependencia falsa |
  | `@InjectMocks` | Crea la clase real que se prueba y le pasa los mocks |
  | `when(...).thenReturn(...)` | Define qué devuelve el mock |

- **Ventaja:** los tests corren en milisegundos y no necesitan MySQL.

### MockMvc

- **Qué es:** una herramienta de Spring para simular pedidos HTTP sin levantar un servidor real.
- **Para qué lo usamos:** tests de integración de los endpoints, que chequean código de estado, JSON de respuesta y seguridad. Por ejemplo, que `GET /api/auth/yo` sin token dé `401`.
- **Dónde está:** `AuthenticationControllerTest` y `LoginBloqueoTest`. Estos tests usan el perfil `test` y **sí necesitan MySQL** corriendo.

### AssertJ

- **Qué es:** una librería para escribir verificaciones legibles.
- **Para qué lo usamos:** comparar resultados, como `assertThat(lista).hasSize(2)`.

## Infraestructura

### Docker Compose

- **Qué es:** una herramienta para levantar contenedores definidos en un archivo.
- **Para qué lo usamos:** correr MySQL 8 en cada máquina con un solo comando, sin instalarlo. Los datos quedan en un volumen, así que no se pierden al apagar el contenedor.
- **Comando:** `docker compose up -d`.
- **Dónde está:** `docker-compose.yml`.

### Variables de entorno (`.env`)

- **Para qué las usamos:** guardar contraseñas y claves (`MYSQL_PASSWORD`, `JWT_SECRET`, `TRAMA_CRYPTO_KEY`) fuera del código. El archivo `.env` está en el `.gitignore` y **nunca se sube**.

### GitHub Actions (CI)

- **Qué es:** automatización de GitHub que corre tareas en cada PR.
- **Para qué lo usamos:** compilar y correr todos los tests en cada PR a `develop`. Si algo falla, no se puede mergear.

### Git hooks (`.githooks/`)

- **Para qué los usamos:** correr chequeos antes de commitear y antes de pushear (por ejemplo, los tests en `pre-push`).
- **Activación (una vez por máquina):** `git config core.hooksPath .githooks`.

## Frontend (`frontend/`) — planificado

Todavía no hay código en el repo. Según `CONTEXTO.md`, el stack va a ser:

| Herramienta | Para qué |
|---|---|
| React + Vite | Construir la interfaz y servirla en desarrollo |
| React Router | Navegar entre pantallas |
| Axios | Llamar a la API (solo desde `src/api/`) |
| Tailwind CSS v4 | Estilos, con todo el tema en `src/styles/tema.css` |
| Vitest + React Testing Library | Tests del frontend |
| ESLint + Prettier + Husky | Revisar y formatear el código antes de cada commit |

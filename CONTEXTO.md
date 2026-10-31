# TRAMA — Contexto del proyecto

> Leé este archivo antes de escribir código. Si usás una IA, pasale este archivo y `AGENTS.md` como contexto.

## Qué es TRAMA

Una app web donde la red de apoyo de un niño autista en edad escolar (familia, docentes y profesionales de salud) comparte la información práctica del día a día: qué le interesa, qué estrategias funcionan, qué hacer si se desregula y qué cambios se vienen. Reemplaza el pasamanos por WhatsApp y los padres que hacen de intermediarios.

**TRAMA no es una historia clínica.** Guarda aportes, observaciones, orientaciones e informes que cada profesional decide compartir, nunca la historia clínica.

## Glosario

| Término | Qué es |
|---|---|
| **Proyecto** | El espacio de un niño. Un usuario puede participar en N proyectos. |
| **Miembro** | Usuario vinculado a un proyecto con un rol. Tabla `membresia`. |
| **Rol** | `TUTOR`, `FAMILIAR`, `EDUCACION` o `SALUD`. Es **por proyecto**: alguien puede ser tutor en uno y profesional en otro. El rol se asigna al crear un proyecto (`TUTOR`) o al aceptar una invitación (lo elige quien invita). |
| **Tipo de cuenta** | `FAMILIA` o `PROFESIONAL`, declarado al registrarse junto con las especialidades del profesional (9.4). No da permisos: sirve para mostrar el plan y precargar las especialidades al sumarse a cada niño. |
| **Administrador** | Un miembro `TUTOR` con `esAdmin = true`. Quien crea el proyecto lo es; puede designar co-tutores. |
| **Aporte** | Cualquier información cargada en el perfil (interés, fortaleza, estrategia, observación, nota profesional, etc.). Tiene autor, versiones y visibilidad. |
| **Bitácora** | La lista de aportes de tipo `OBSERVACION` y `ABC`, ordenada por fecha. |
| **Evento** | Algo en el calendario del niño. Puede ser único o semanal y estar marcado como "cambio". |

## Reglas de negocio que el código siempre respeta

1. **Todo se evalúa por proyecto.** Antes de leer o escribir algo de un proyecto, se verifica que el usuario sea miembro con el rol que corresponde. Para eso se usa siempre `PermisoService` (ver más abajo), nunca lógica propia en el controlador.
2. **Solo el autor edita o archiva su aporte.** Nadie modifica el aporte de otro, ni siquiera el tutor.
3. **Los aportes no se borran: se archivan.** Cada edición guarda una versión nueva en `aporte_version`.
4. **Visibilidad por aporte.** Cada aporte tiene una visibilidad (`TODOS`, `SOLO_SALUD`, `SOLO_EDUCACION`, `SOLO_TUTORES`). Los tutores ven todo. Toda consulta que lista aportes filtra por visibilidad **en la consulta a la base**, no después.
5. **Solo los tutores administradores invitan, revocan y designan co-tutores.**
6. **Nada se genera automáticamente.** No hay recomendaciones, algoritmos ni IA dentro del producto. Todo contenido lo escribe una persona.
7. **Solo datos mock.** Ningún entorno tiene datos de niños reales.
8. **Freemium:** un profesional edita gratis en hasta 2 proyectos; en los demás queda en solo lectura. Las familias nunca pagan.
9. **Tope de niños por cuenta:** cualquier cuenta crea o administra como tutora hasta 2 niños (9.4). Así la cuenta de familia no reemplaza al plan profesional.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 3 · Maven (`./mvnw`) |
| Persistencia | MySQL 8 · Spring Data JPA · Flyway (migraciones) |
| Seguridad | Spring Security con JWT · contraseñas con BCrypt |
| Validación | Jakarta Bean Validation (`@NotBlank`, `@Size`, etc.) |
| Utilidades | Lombok (solo `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`, `@RequiredArgsConstructor`) |
| Tests back | JUnit 5 · Mockito · AssertJ |
| Frontend | React · Vite · JavaScript · React Router · Axios |
| Estilos | Tailwind CSS v4, con todo el tema en un único CSS global: `src/styles/tema.css` |
| Tests front | Vitest · React Testing Library |
| Calidad | ESLint + Prettier (front) · Husky + lint-staged · hooks en `.githooks` (back) |
| Local | Docker Compose para MySQL |
| CI | GitHub Actions: build + tests en cada PR |

No se agregan librerías nuevas sin avisar en el grupo y que Ana (back) o Zoe (front) lo aprueben.

## Estructura del repositorio

```
trama/
├── backend/                # backend Spring Boot
├── frontend/
├── compose.yml     # MySQL local
├── .githooks/             # hooks del backend
├── .github/workflows/     # CI
├── CONTEXTO.md            # este archivo
├── AGENTS.md              # reglas para la IA
└── README.md              # cómo levantar el proyecto
```

### Backend: estructura actual y organización por módulos

El backend actual se encuentra en `demo/` y utiliza el paquete base `com.trama.tpo.demo`.
La estructura siguiente muestra **solo los paquetes confirmados en la revisión**, no un inventario exhaustivo. La organización por módulos que se describe más abajo es una **convención objetivo**; no significa que todos esos módulos ya existan.

El módulo de planes/licencias para freemium todavía no está implementado. Antes de crearlo, definir con el equipo cómo se seleccionan los dos proyectos editables y cómo se registra una licencia.

```
demo/src/main/java/com/trama/tpo/demo/
├── config/            # SecurityConfig, JwtService, JwtAuthenticationFilter y otras configuraciones
├── entity/            # entidades JPA (incluye usuario/Usuario.java)
├── exceptions/        # ApiException, GlobalExceptionHandler
└── .../               # otros paquetes existentes, según el código del repositorio
```

Dentro de cada módulo, siempre las mismas piezas:

```
aporte/
├── Aporte.java              # entidad JPA
├── AporteRepository.java    # Spring Data
├── AporteService.java       # lógica de negocio (acá van las reglas)
├── AporteController.java    # solo recibe, delega y responde
└── dto/
    ├── AporteRequest.java   # record
    └── AporteResponse.java  # record
```

- **Controller:** valida la entrada con `@Valid`, llama al service y devuelve un DTO. Sin lógica de negocio.
- **Service:** reglas de negocio y permisos. Es lo que se testea.
- **Repository:** solo consultas.
- **DTOs:** `record` de Java. **Nunca se devuelve una entidad JPA desde un controlador.**
- Los mapeos entidad ↔ DTO van como métodos estáticos en el DTO (`AporteResponse.from(aporte)`). No usamos MapStruct.

### Frontend: una carpeta por funcionalidad

```
frontend/src/
├── api/               # cliente.js (instancia de Axios con el token) + un archivo por módulo
├── components/ui/     # componentes reutilizables: Boton, Campo, Tarjeta, Modal, Selector...
├── features/          # una carpeta por módulo: auth/, proyecto/, perfil/, bitacora/, calendario/...
│   └── perfil/
│       ├── components/
│       ├── hooks/
│       └── PerfilPage.jsx
├── hooks/             # hooks compartidos (useAuth, useProyectoActual)
├── routes/            # rutas de la app
└── utils/
```

- **Antes de crear un componente, buscá en `components/ui/`.** Si existe algo parecido, se usa o se extiende.
- Las llamadas a la API van **solo** en `src/api/`. Los componentes no llaman a Axios directamente.
- Un componente por archivo, nombre en `PascalCase.jsx`.

## El aporte genérico

Intereses, fortalezas, comunicación, perfil sensorial, estrategias, rutinas, "qué hacer si se desregula", observaciones, notas profesionales, registros ABC y sugerencias son **todos aportes**. Así las reglas de autor, versiones y visibilidad se programan una sola vez.

```
Aporte
  id, proyecto_id, autor_id
  tipo          INTERES | FORTALEZA | COMUNICACION | SENSORIAL | ESTRATEGIA | RUTINA |
                DESREGULACION | OBSERVACION | NOTA_PROFESIONAL | ABC | SUGERENCIA
  titulo        texto corto
  contenido     texto
  datos         JSON con los campos propios del tipo (ej. intensidad de un interés, pasos de una rutina)
  visibilidad   TODOS | SOLO_TUTORES | SOLO_SALUD | SOLO_EDUCACION
  archivado     boolean
  creado_en, actualizado_en

AporteVersion   (una fila por cada edición)
  id, aporte_id, autor_id, titulo, contenido, datos, creado_en
```

**Un tipo nuevo de sección no es una tabla nueva:** es un valor nuevo del enum `TipoAporte` y, si hace falta, campos nuevos dentro de `datos`.

El backend valida los campos comunes (`titulo`, `contenido`, `visibilidad`). Los campos propios de cada tipo dentro de `datos` los valida el frontend.

Los componentes compartidos del aporte (`api/aportes.js`, `TarjetaAporte`, `SelectorVisibilidad`) se usan en todas las secciones. No se crea una tarjeta distinta por sección.

## Permisos: siempre `PermisoService`

```java
// En cualquier service, antes de operar sobre un proyecto:
permisoService.verificarMiembro(proyectoId);          // es miembro
permisoService.verificarAdmin(proyectoId);           // es tutor administrador
permisoService.verificarPuedeEditar(proyectoId);     // puede editar según rol y configuración actual
permisoService.verificarAutor(autorId);              // coincide con el autor del aporte
```

La implementación actual obtiene el usuario autenticado mediante `UsuarioActual` y lanza `AccessDeniedException` si falta un permiso; Spring Security responde `403` mediante el manejador de acceso denegado. **No se duplica esta lógica en ningún otro lado.**

`verificarPuedeEditar` aplica el límite freemium de dos proyectos para profesionales (9.0) y `verificarPuedeCrearProyecto` el tope de dos niños por cuenta (9.4). El control de autor debe combinarse con la comprobación de membresía y permisos del proyecto en los servicios que operen sobre aportes.

## Seguridad de los datos

Son datos de niños: aunque hoy usemos datos mock, el código se escribe como si fueran reales.

1. **Ids UUID en todas las entidades.** Nunca 1, 2, 3…: así las direcciones no se pueden adivinar.
2. **Todo endpoint de un proyecto verifica permisos con `PermisoService`.** Un test automático (historia 0.21) llama a todos los endpoints con un usuario ajeno y falla el CI si alguno responde datos.
3. **El texto libre sobre el niño se guarda cifrado** (AES-256-GCM, historia 0.20) con el convertidor `@Convert(converter = CifradoConverter.class)`. Hoy se aplica a `aporte.contenido`, `aporte.datos`, sus versiones, comentarios, descripción de eventos, actas y motivos de revisión. **Cualquier columna nueva con texto libre sobre el niño lleva el convertidor.**
4. Como el contenido está cifrado, no se filtra ni se busca con SQL sobre ese texto: se leen los aportes del niño y se filtra en el service.
5. Los archivos adjuntos se guardan cifrados en disco.
6. La clave está en la variable de entorno `TRAMA_CRYPTO_KEY`, nunca en el repo.
7. Nunca se escribe contenido sensible en los logs.
8. Login: tras 5 intentos fallidos seguidos, la cuenta se bloquea 15 minutos.

## API

- Prefijo: `/api`. Recursos en plural y en español: `/api/proyectos/{proyectoId}/aportes`.
- JSON en `camelCase`.
- Errores siempre con el mismo formato, armado por `GlobalExceptionHandler`:
  ```json
  { "codigo": "ACCESO_DENEGADO", "mensaje": "No tenés permiso para ver este proyecto" }
  ```
- Códigos de estado: `200` OK · `201` creado · `400` datos inválidos · `401` sin sesión · `403` sin permiso · `404` no existe.

## Diseño y estilos

Sofía define la **guía de estilo** (historia 0.15) y los **mockups** de cada pantalla, una semana antes de que se programen. El link del mockup está en la tarjeta de Trello. **Las pantallas se construyen iguales al mockup.**

Todo el aspecto visual sale de **un solo archivo**: `frontend/src/styles/tema.css`.

```css
@import "tailwindcss";

@theme {
  --color-fondo: #...;        /* crema */
  --color-primario: #...;     /* terracota */
  --color-secundario: #...;   /* oliva */
  --color-agua: #...;
  --color-miel: #...;
  --color-texto: #...;
  --color-texto-suave: #...;
  --color-borde: #...;
  --color-exito: #...;
  --color-error: #...;
  --color-aviso: #...;
  --font-base: "...", sans-serif;
  /* espaciados, radios y sombras de la guía de estilo */
}
```

Los valores los completa Zoe con los tokens de Sofía. Tailwind genera las clases a partir de ese archivo: `bg-fondo`, `text-primario`, `border-borde`, etc.

**Reglas:**

1. Los colores, tipografías, tamaños y sombras se usan **solo** con las clases del tema (`bg-primario`, `text-texto-suave`). Nunca un hex, un `rgb()` o un valor arbitrario (`text-[#B5543A]`, `p-[13px]`).
2. Nada de `style={{ ... }}` en los componentes.
3. Si falta un color o un tamaño, se le pide a Sofía y se agrega a `tema.css`. No se inventa uno en el componente.
4. Antes de armar una pantalla, se usan los componentes de `components/ui/`. Si el mockup tiene algo que no existe, se crea en `components/ui/` para que lo reutilicen los demás.
5. `npm run check:estilos` lo verifica solo en el pre-commit y en el CI: un color suelto hace fallar el commit.

## Base de datos

- El esquema se cambia **solo con migraciones Flyway** en `backend/src/main/resources/db/migration/`.
- Nombre del archivo: `V<AAAAMMDDHHMM>__descripcion.sql` (ej. `V202610071530__crear_tabla_aporte.sql`). La fecha evita choques entre 7 personas.
- **Una migración que ya está en `develop` no se modifica nunca.** Si hay que corregir algo, se crea una nueva.
- `spring.jpa.hibernate.ddl-auto=validate`. Hibernate no crea tablas.
- Tablas y columnas en `snake_case`, entidades en `PascalCase`.

## Datos mock y tablas nuevas

- Cada historia crea las tablas que necesita con su migración y agrega sus datos mock al `DataSeeder`.

- Se cargan con el perfil `dev` desde un script de seed (historia 0.12).
- Usuarios de prueba: `tutor@trama.test`, `docente@trama.test`, `psico@trama.test`, todos con la contraseña `Trama1234!`.
- Niños ficticios. Nunca nombres ni datos de personas reales.

## Convenciones

| Qué | Cómo |
|---|---|
| Idioma del dominio | Español: `Aporte`, `Proyecto`, `Membresia` |
| Sufijos técnicos | Inglés: `AporteService`, `AporteController`, `AporteRepository`, `AporteRequest`, `PerfilPage`, `usePerfil` |
| Front | Español: componentes (`Boton`, `Campo`, `TarjetaAporte`), funciones (`listarMiembros`), variables y rutas (`/acompanamientos`), como en el mockup |
| Infraestructura de seguridad | Puede quedar en inglés: `JwtService`, `AuthenticationService`, `CryptoService` |
| Nombres de archivo | Sin `ñ` ni tildes: `CampoContrasena.jsx` |
| Textos de la app | Español rioplatense, lenguaje claro, no clínico ("le cuesta", no "déficit") |
| Ramas | `feature/<id>-descripcion` (ej. `feature/1.10-mis-proyectos`) |
| Commits | `<id>: qué se hizo` (ej. `2.1: alta de interés con validación`) |
| PR | A `develop`, con el CI en verde y 1 aprobación. Título igual al de la tarjeta de Trello. |

## Tests: lo mínimo obligatorio

- **Backend:** cada método público de un service con lógica tiene al menos un test del caso bueno y uno del caso de error. Cada regla de permisos tiene un test que verifica el `403`.
- **Frontend:** tests para hooks y funciones en `utils/` que tengan lógica. Los componentes puramente visuales no necesitan test.
- Los tests corren en el hook `pre-push` y en el CI. Si fallan, no se sube.

## Configuración de entornos

- `backend/src/main/resources/application.properties`: configuración común, `ddl-auto=validate`, Flyway y perfil `dev` por defecto.
- `backend/src/main/resources/application-dev.yml`: MySQL local (`localhost:${MYSQL_PORT:3307}/trama`), usuario `trama`, contraseña `${MYSQL_PASSWORD}`. El puerto puede configurarse mediante `MYSQL_PORT`.
- `backend/src/main/resources/application-prod.yml`: conexión mediante `${DB_URL}`, `${DB_USERNAME}` y `${DB_PASSWORD}`; puerto `${SERVER_PORT:8080}`.
- En desarrollo, `application.properties` importa opcionalmente `../.env` **respecto del directorio de ejecución**. El archivo `.env` no debe subirse a Git.
- `JWT_SECRET` debe configurarse como variable de entorno o mediante el `.env` local, sin incorporarlo al repositorio.

## Comandos

```bash
docker compose up -d                 # levanta MySQL
cd backend && ./mvnw spring-boot:run # backend en http://localhost:4002 (si SERVER_PORT no está definido)
cd backend && ./mvnw test            # tests del backend
cd frontend && npm install           # instala dependencias y los hooks de Husky
cd frontend && npm run dev           # frontend en http://localhost:5173
cd frontend && npm test              # tests del frontend
git config core.hooksPath .githooks  # una sola vez, activa los hooks del backend
```
# Trama

![CI Trama](https://github.com/tiziicocaro0/Trama/actions/workflows/ci.yml/badge.svg?branch=develop)

Trama es una plataforma colaborativa diseñada para mejorar la comunicación y el seguimiento interdisciplinario de niños con Trastorno del Espectro Autista (TEA).

Su objetivo es centralizar la información relevante de cada niño y facilitar el intercambio de observaciones, avances y orientaciones entre familias, profesionales de la salud y educadores, promoviendo un acompañamiento integral y coordinado.

## Tecnologías utilizadas

### Backend
- Java 21
- Spring Boot
- Maven

### Frontend
- Node.js y npm
- Framework pendiente de configuración

### Herramientas e infraestructura
- Git y GitHub
- GitHub Actions (CI)
- Docker y Docker Compose
- Visual Studio Code

## Requisitos previos

Para trabajar con el proyecto se necesita:

- Git instalado
- Java JDK 21
- Node.js y npm
- Docker Desktop
- Visual Studio Code u otro IDE compatible

## Estructura del proyecto

```text
Trama/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
├── frontend/
└── README.md
```

- `backend/`: aplicación desarrollada con Spring Boot y Maven.
- `frontend/`: interfaz de usuario.
- `.github/workflows/`: configuración de integración continua.
- `README.md`: documentación del proyecto.

**Nota:** el proyecto base del frontend todavía está en preparación.

## Clonar el repositorio

Para descargar el proyecto por primera vez:

1. Abrir una terminal en la carpeta donde se desea guardar el proyecto.
2. Ejecutar:

```bash
git clone https://github.com/tiziicocaro0/Trama.git
```

3. Ingresar a la carpeta del proyecto:

```bash
cd Trama
```

4. Cambiar a la rama principal de desarrollo:

```bash
git switch develop
```

5. Abrir el proyecto en Visual Studio Code:

```bash
code .
```

## Flujo de trabajo con Git y GitHub

Para mantener el código organizado y evitar modificaciones accidentales en las ramas principales, el equipo utiliza un flujo de trabajo basado en ramas y Pull Requests.

### Ramas principales

- `main`: contiene la versión estable del proyecto.
- `develop`: rama predeterminada donde se integran los desarrollos.
- `feature/*`: ramas destinadas a nuevas funcionalidades.
- `fix/*`: ramas para corrección de errores.
- `chore/*`: ramas para tareas técnicas, mantenimiento y configuración.

### Reglas de trabajo

1. No realizar commits ni pushes directamente sobre `main` o `develop`.
2. Crear una rama de trabajo a partir de `develop` para cada tarea.
3. Realizar los cambios y commits en la rama correspondiente.
4. Subir la rama al repositorio remoto.
5. Crear un Pull Request hacia `develop`.
6. Solicitar la revisión de otro integrante del equipo.
7. Verificar que los tests automáticos se ejecuten correctamente.
8. Fusionar el Pull Request únicamente cuando esté aprobado y las verificaciones hayan pasado.
9. Integrar los cambios de `develop` a `main` mediante un Pull Request cuando se prepare una versión estable.

### Ejemplo: crear una rama de trabajo

Primero, actualizar `develop`:

```bash
git switch develop
git pull origin develop
```

Crear una rama para una nueva funcionalidad:

```bash
git switch -c feature/login
```

Realizar los cambios correspondientes y guardarlos:

```bash
git add .
git commit -m "feat: implementar login"
```

Subir la rama a GitHub:

```bash
git push -u origin feature/login
```

Finalmente, ingresar a GitHub y crear un Pull Request desde `feature/login` hacia `develop`.

### Flujo de integración

```text
develop
   |
   | Crear rama de trabajo
   v
feature/nombre-tarea
   |
   | Desarrollo y commits
   v
Pull Request hacia develop
   |
   | Revisión + tests
   v
develop
   |
   | Validación de versión estable
   v
Pull Request hacia main
   |
   | Revisión + tests
   v
main
```

## Protección de ramas

Las ramas `main` y `develop` tienen configuradas reglas de protección en GitHub.

Estas reglas establecen:

- Los cambios deben incorporarse mediante Pull Requests.
- Se requiere al menos una aprobación para fusionar cambios.
- Se bloquean los force pushes.
- Se restringe la eliminación de las ramas protegidas.

Las reglas deben respetarse incluso cuando un integrante tenga permisos de administración.

## Integración continua (CI)

Trama utiliza GitHub Actions para ejecutar verificaciones automáticas sobre los Pull Requests dirigidos a `develop` y `main`.

El workflow se encuentra en:

`.github/workflows/ci.yml`

### Backend

Se utiliza Maven para ejecutar los tests:

```bash
./mvnw test
```

En Windows, el comando equivalente es:

```powershell
.\mvnw.cmd test
```

### Frontend

El workflow está preparado para ejecutar:

```bash
npm ci
npm run lint
npm test
```

Los comandos definitivos se verificarán cuando esté disponible el proyecto frontend.

### Estado de la CI

- **Backend:** el CI levanta un MySQL de prueba y corre todos los tests en cada Pull Request.
- **Frontend:** el job se activa automáticamente cuando exista `frontend/package.json`.

### Configuración de Git Hooks

Trama usa un hook local `pre-push` que corre **los mismos pasos que el CI** antes de subir cambios, para no enterarse recién en el Pull Request de que algo falla.

#### Activación

Cada integrante debe activarlo **una vez** por cada copia local del repositorio. Desde la carpeta raíz de Trama:

```bash
git config core.hooksPath .githooks
```

#### Requisitos

- MySQL levantado: `docker compose up -d`
- Archivo `.env` en la raíz (copiado de `.env.example` y completado), con `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` y `JWT_SECRET`. El hook lo lee solo.
- Java 21 y Node 22, las mismas versiones del CI (si no coinciden, el hook avisa).

#### Funcionamiento

Primero hace `git fetch origin develop` y revisa que la rama que se sube **contenga todo el develop actual**. Si le faltan commits, cancela el push y pide `git merge origin/develop`. Así los tests prueban la rama tal como va a quedar después del merge, y no contra un develop viejo. Con varios PR abiertos, cada vez que se mergea uno, los demás tienen que traer develop antes de volver a pushear. Los push directos a `develop` o `main` no pasan por este chequeo, y si no hay conexión solo se avisa.

Después mira qué cambió entre los commits que se suben y llama a `scripts/verificar-ci.sh`:

| Si cambia… | Se corre |
| --- | --- |
| `backend/` | Se recrea la base `trama_test` **vacía** (como en el CI) y se corre `./mvnw -B clean test` |
| `frontend/` | `npm run lint` (ESLint + `check:estilos`) y `npm test -- --run` |
| `frontend/package.json` o `package-lock.json` | Además, `npm ci`, que falla si el lock no coincide con `package.json` |
| `.github/` | Backend y frontend |

En todos los casos se buscan marcadores de conflicto (`<<<<<<<` / `>>>>>>>`) olvidados. Si algo falla, el push se cancela.

También se puede correr a mano en cualquier momento:

```bash
sh scripts/verificar-ci.sh              # todo
sh scripts/verificar-ci.sh --backend    # solo backend
sh scripts/verificar-ci.sh --frontend   # solo frontend
```

**Nota:** el hook verifica tu copia de trabajo, así que conviene pushear con todo commiteado. Complementa los checks obligatorios de los Pull Requests, no los reemplaza.

## Despliegue local con Docker Compose

El proyecto cuenta con un entorno de prueba que permite levantar MySQL y el backend Spring Boot mediante Docker Compose, sin necesidad de iniciar manualmente cada servicio.

### 1. Requisitos

- Tener Docker Desktop instalado y en funcionamiento.
- Estar ubicado en la carpeta raíz del repositorio.
- Contar con el archivo `.env` configurado.

Si todavía no existe `.env`, copiar `.env.example` y completar las variables:

```env
MYSQL_PASSWORD=
MYSQL_ROOT_PASSWORD=
JWT_SECRET=
TRAMA_CRYPTO_KEY=
TRAMA_BACKUP_KEY=
```

`TRAMA_CRYPTO_KEY` y `TRAMA_BACKUP_KEY` son las claves de cifrado (AES-256, en Base64). Se generan una vez con `openssl rand -base64 32`, cada una por separado: tienen que ser distintas. Las variables `OPENBAO_*` las agrega solo `openbao/inicializar.sh` (ver la sección 9).

Las contraseñas y claves deben mantenerse privadas. El archivo `.env` no debe subirse al repositorio.

### 2. Levantar los servicios

Desde la raíz del proyecto, ejecutar:

```bash
docker compose --profile app up -d --build
```

Este comando construye la imagen del backend e inicia MySQL y el backend.

> **OpenBao:** el backend en Docker pide sus claves a OpenBao. La primera vez hay que inicializarlo, y después de cada reinicio hay que abrirlo: ver la [sección 9](#9-openbao-claves-de-cifrado). Mientras OpenBao esté sellado, el backend espera y no arranca.

> `docker compose up -d` (sin `--profile app`) levanta **solo MySQL**, que es lo que se usa para desarrollar con el backend corriendo desde el IDE. Así no chocan en el puerto 4002.

### 3. Comprobar el funcionamiento

Para consultar el estado de los contenedores:

```bash
docker compose ps
```

Para comprobar que Spring Boot está funcionando, acceder a:

http://localhost:4002/actuator/health

El resultado esperado es una respuesta HTTP 200:

```json
{"status":"UP"}
```

También se pueden consultar los registros del backend:

```bash
docker compose logs --tail=80 backend
```

### 4. Accesos del entorno local

| Servicio | Dirección |
|---|---|
| Backend | http://localhost:4002 |
| Estado del backend | http://localhost:4002/actuator/health |
| MySQL | localhost:3307 |

### 5. Detener los servicios

```bash
docker compose --profile app stop
```

Este comando detiene los contenedores sin eliminar los datos persistentes: la base (volumen `trama-mysql-data`) y los archivos adjuntos (volumen `trama-uploads`).

No utilizar `docker compose down -v`, ya que elimina también los volúmenes: se pierden la base **y** los archivos.

### 6. Archivos adjuntos

El backend guarda los archivos adjuntos cifrados en `/app/uploads`, dentro de su contenedor. Esa carpeta es el volumen persistente `trama-uploads`: los archivos no se pierden al reiniciar o reconstruir el contenedor.

| Dónde corre el backend | Carpeta de archivos |
|---|---|
| Docker Compose (`--profile app`) | `/app/uploads`, en el volumen `trama-uploads` |
| Desde el IDE o con `./mvnw` | `backend/uploads/`, ignorada por git. Se puede cambiar con `UPLOADS_DIR` en el `.env` |

Para ver los archivos guardados (cada uno tiene un nombre UUID y está cifrado):

```bash
docker exec trama-backend ls -la /app/uploads
```

La base y los archivos van juntos: la tabla `archivo` guarda el nombre de cada uno. Para respaldar o mover el entorno, siempre hay que copiar los dos volúmenes a la vez.

### 7. Backups cifrados

Un backup guarda **juntos** la base y los archivos adjuntos, en un solo archivo cifrado con AES-256. La clave (`TRAMA_BACKUP_KEY`) la pide a OpenBao, así que OpenBao tiene que estar abierto (ver la sección 9).

Hacer un backup (MySQL y OpenBao tienen que estar levantados):

```bash
docker compose --profile backup run --rm backup
```

Queda en `backups/trama-AAAAMMDD-HHMMSS.tar.gz.gpg`, carpeta ignorada por git.

Restaurar en una base de **prueba** (`trama_restaurada`), sin tocar los datos reales:

```bash
docker compose --profile backup run --rm --entrypoint sh backup \
    /scripts/restaurar.sh trama-AAAAMMDD-HHMMSS.tar.gz.gpg
```

Para restaurar sobre la base y los archivos **reales**, agregar `--sobrescribir-real` al final.

⚠️ Guardar las claves **fuera** de los backups: sin `TRAMA_BACKUP_KEY` el backup no se puede abrir, y sin `TRAMA_CRYPTO_KEY` los campos sensibles de la base restaurada no se pueden leer.

### 8. Actualizar los contenedores

Después de traer cambios de `develop` que tocan el `docker-compose.yml`, el `Dockerfile` o el backend:

```bash
docker compose --profile app up -d --build
```

Los contenedores se recrean con la configuración nueva y los datos de los volúmenes se mantienen.

### 9. OpenBao (claves de cifrado)

OpenBao es el KMS de TRAMA: guarda `TRAMA_CRYPTO_KEY` y `TRAMA_BACKUP_KEY` y se las entrega al backend en Docker y al backup. Cómo está armado y cómo funciona: [docs/plan-openbao.md](docs/plan-openbao.md).

**La primera vez** (una sola vez por entorno):

```bash
docker compose --profile app up -d openbao
sh openbao/inicializar.sh
```

Carga tus claves del `.env` en OpenBao y agrega al `.env` la clave de apertura y los tokens (`OPENBAO_*`).

**Después de reiniciar la Mac, Docker o el contenedor**, OpenBao arranca sellado. Para abrirlo:

```bash
sh openbao/abrir.sh
```

También renueva el token del backend por 32 días. El backend arranca solo cuando OpenBao queda abierto.

**Si `abrir.sh` avisa que el token venció** (pasó más de un mes sin abrirlo):

```bash
sh openbao/nuevo-token.sh
docker compose --profile app up -d --force-recreate backend
```

⚠️ Para tener en cuenta:
- Desde el IDE, con `./mvnw` y en los tests, OpenBao **no se usa**: las claves salen del `.env`.
- `TRAMA_CRYPTO_KEY` **no se cambia nunca sola**: tiene que ser la misma en el `.env` y en OpenBao.
- `docker compose down -v` borra el volumen de OpenBao. Las claves siguen en el `.env`: se recupera borrando las líneas `OPENBAO_*` del `.env` y volviendo a correr `inicializar.sh`.
- El `.env` tiene la llave de todo: nunca se sube ni se comparte.

**Estado actual:** el despliegue mediante Docker Compose incluye MySQL y Spring Boot. La incorporación del frontend con Nginx queda pendiente hasta que el equipo integre su estructura en `develop`.

## Ejecución local

### Backend

Cuando esté disponible el proyecto Spring Boot, se podrá iniciar desde la carpeta `backend` utilizando Maven Wrapper.

En Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

#### 1. Variables de entorno

Copiar `.env.example` como `.env` en la raíz del repo y completar los valores:

```
MYSQL_PASSWORD=...
MYSQL_ROOT_PASSWORD=...
JWT_SECRET=...
TRAMA_CRYPTO_KEY=...
```

- `JWT_SECRET`: al menos 32 caracteres. Se genera con `openssl rand -base64 48`.
- `TRAMA_CRYPTO_KEY`: exactamente 32 bytes en base64. Se genera con `openssl rand -base64 32`. Ver [Seguridad de los datos](#seguridad-de-los-datos).

El `.env` nunca se sube al repo.

#### 2. Levantar MySQL

Con Docker Desktop abierto, desde la raíz:

```bash
docker compose up -d mysql
```

Conexión: `jdbc:mysql://localhost:3307/trama`, usuario `trama`, contraseña la de `MYSQL_PASSWORD`.

Para apagarlo: `docker compose stop`. Ojo: `docker compose down -v` borra los datos.

#### 3. Levantar el backend

```bash
cd backend
./mvnw spring-boot:run      # macOS / Linux
.\mvnw.cmd spring-boot:run  # Windows
```

### Datos mock (DataSeeder)

Con el perfil `dev` (el que viene por defecto), la clase `DataSeeder` carga datos ficticios la primera vez que arranca la app. Si ya existen, no hace nada.

Usuarios de prueba, todos con la contraseña `Trama1234!`:

| Email | Rol |
|---|---|
| `tutor@trama.test` | Tutora admin de Tomi |
| `cotutor@trama.test` | Co-tutor de Tomi |
| `familiar@trama.test` | Familiar en los 3 proyectos |
| `docente@trama.test` | Docente en los 3 proyectos |
| `psico@trama.test` | Psicólogo en los 3 proyectos (en el 3.º, solo lectura por plan gratuito) |
| `tutora.valen@trama.test` | Tutora admin de Valen |
| `tutor.juli@trama.test` | Tutor admin de Juli |

**Regla:** cada historia que crea una tabla nueva agrega sus datos mock al `DataSeeder`.

Para volver a cargar los datos desde cero, vaciar las tablas y levantar la app de nuevo.


### Frontend

Los comandos de instalación y ejecución se documentarán cuando se incorpore la estructura base del frontend.

## Seguridad de los datos

TRAMA guarda información sobre niños. Aunque hoy todos los datos son ficticios, el código se escribe como si fueran reales.

### Qué se cifra

Todo el texto libre que se carga sobre el niño se guarda cifrado en la base:

| Tabla | Columnas |
|---|---|
| `aporte` | `contenido`, `datos` |
| `aporte_version` | `contenido`, `datos` |
| `comentario` | `texto` |
| `evento` | `descripcion`, `acta` (actas de reunión) |
| `solicitud_revision` | `motivo` |

Los archivos adjuntos también se guardan cifrados en disco.

**No se cifran** los títulos de los aportes y eventos, porque se muestran en listados. Por eso un título nunca debe tener información sensible.

### Cómo se cifra

- **Algoritmo:** AES-256-GCM, con `CryptoService`.
- **Un IV aleatorio por valor:** el mismo texto cifrado dos veces da resultados distintos. El IV (12 bytes) se guarda adelante del texto cifrado, en la misma columna: `[IV][texto cifrado + tag]`.
- **Integridad:** GCM agrega un tag de autenticación. Si alguien modifica un dato en la base, no se puede descifrar.
- **En las entidades:** las columnas cifradas usan el convertidor `CifradoConverter`. Cifra al guardar y descifra al leer, así que el resto del código trabaja con texto normal.

```java
@Convert(converter = CifradoConverter.class)
@Column(name = "contenido", columnDefinition = "MEDIUMBLOB")
private String contenido;
```

### Dónde está la clave

- En la variable de entorno **`TRAMA_CRYPTO_KEY`** (32 bytes en base64) y, para el backend en Docker, en **OpenBao**, el KMS del proyecto (ver [docs/plan-openbao.md](docs/plan-openbao.md)).
- **Nunca en el código ni en el repositorio.** En local va en el `.env`, que está ignorado por git. En el CI se genera una clave nueva en cada corrida.
- **Distinta en cada entorno:** cada integrante genera la suya con `openssl rand -base64 32`, y producción tiene la propia.
- Si falta o no tiene 32 bytes, la app no arranca.
- ⚠️ **Si se pierde o se cambia la clave, lo cifrado con ella ya no se puede leer.** En local alcanza con vaciar las tablas y dejar que el `DataSeeder` vuelva a cargar los datos. En producción, la clave se guarda y se respalda aparte.

### Reglas para el equipo

- Toda columna nueva con texto libre sobre el niño lleva `@Convert(converter = CifradoConverter.class)` y es de tipo `VARBINARY` o `MEDIUMBLOB`.
- No se filtra ni se busca con SQL sobre columnas cifradas (por ejemplo, los filtros de la bitácora y la búsqueda). Se leen los aportes del niño y se filtra en el service.
- En `VARBINARY(4096)` el texto puede tener hasta unos 4000 bytes, porque el IV y el tag ocupan 28. Validarlo con `@Size` en el DTO.
- Nunca se escribe contenido cifrado ni descifrado en los logs.

## Estado del proyecto

Trama se encuentra en etapa inicial de desarrollo.

Actualmente se trabaja en:

- Configuración del repositorio y permisos.
- Desarrollo de la estructura base del backend.
- Desarrollo de la estructura base del frontend.
- Integración continua con GitHub Actions.
- Preparación del entorno de desarrollo.

## Equipo

Proyecto académico desarrollado por el equipo de Trama.
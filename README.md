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

**Nota:** los proyectos base del backend y frontend todavía están en preparación.

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

La integración continua está configurada inicialmente, pero los tests todavía no pueden completarse correctamente porque los proyectos base del backend y frontend están pendientes.

Una vez incorporados, se validarán las ejecuciones y se configurarán los checks obligatorios para impedir merges cuando fallen los tests.

## Ejecución local

### Backend

Cuando esté disponible el proyecto Spring Boot, se podrá iniciar desde la carpeta `backend` utilizando Maven Wrapper.

En Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Frontend

Los comandos de instalación y ejecución se documentarán cuando se incorpore la estructura base del frontend.

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
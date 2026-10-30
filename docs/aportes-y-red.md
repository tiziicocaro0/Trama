# Aportes del perfil y Red

La portada conserva las seis secciones de RF-10 y muestra hasta tres aportes por sección,
ordenados por fecha de creación descendente. «Ver todo» muestra la sección completa.
Los aportes del perfil ya provienen de la base; los ejemplos de `perfil.mock.js` solo se
usan como fixtures de tests.

## Recorrido

1. Iniciar sesión y abrir Acompañamientos.
2. Elegir un niño y pulsar «Agregar aporte» en una sección.
3. Completar título, descripción opcional y visibilidad; guardar.
4. «Editar» aparece en aportes propios cuando el usuario puede escribir en el proyecto.
5. «Red» muestra a todos los miembros del proyecto con nombre, apellido y rol; marca a los
   administradores y, para Educación y Salud, la especialidad (o que no se informó).
6. «Datos personales» muestra nombre, apellido, apodo, fecha de nacimiento, colegio y grado
   guardados al crear el acompañamiento; esta vista es de consulta.
7. «Notas» permite agregar notas y editar las propias. Muestra fecha y hora de creación
   tomadas del servidor, en la zona horaria del navegador, y la última edición si cambió.

Los tres botones comparten estilo y navegación entre `/proyectos/:id/red`,
`/proyectos/:id/datos-personales` y `/proyectos/:id/notas`. La portada conserva sus seis
secciones originales; las notas se consultan por separado.

La vinculación o invitación de profesionales no forma parte de este cambio.

## API que usa el perfil

El back de aportes es el de la card 3.0 (Ana). Todas las rutas requieren JWT y verifican
permisos con `PermisoService`.

| Método | Ruta | Contrato |
|---|---|---|
| GET | `/api/proyectos/{proyectoId}` | Datos del proyecto; incluye `puedeCargar` (si el usuario puede cargar aportes) |
| GET | `/api/proyectos/{proyectoId}/aportes?tipo=&archivados=false` | Lista de `AporteResponse` visibles para el usuario |
| POST | `/api/proyectos/{proyectoId}/aportes` | Recibe `AporteRequest`; devuelve `201` con `AporteResponse` |
| PUT | `/api/proyectos/{proyectoId}/aportes/{aporteId}` | Recibe `AporteRequest`; solo el autor (403 si no) |
| POST | `/api/proyectos/{proyectoId}/aportes/{aporteId}/archivar` | Solo el autor; el perfil todavía no tiene botón de archivar |
| GET | `/api/proyectos/{proyectoId}/aportes/{aporteId}/versiones` | Historial (3.2): todas las versiones, la actual incluida, de la más nueva a la más vieja. Cualquier miembro que puede ver el aporte; las versiones no se modifican |
| GET | `/api/proyectos/{proyectoId}/miembros` | Lista de `{ id, usuarioId, nombre, apellido, rol, esAdmin, especialidad, fechaAlta }` (card 1.3); `id` corresponde a la membresía |

`AporteRequest` contiene `tipo`, `titulo` (obligatorio, hasta 150 caracteres), `contenido`,
`datos` (JSON con los campos propios del tipo) y `visibilidad` (si falta, se usa la del tipo).
Intereses exigen `datos.categoria` y `datos.intensidad`; fortalezas exigen `datos.contexto`.
La sección «Notas» usa el tipo `NOTA_PROFESIONAL` (4.2): solo la cargan miembros `EDUCACION` o `SALUD`
(el resto recibe `403`), y su `datos` exige `tipoNota` (`ORIENTACION`, `OBSERVACION`, `INFORME_BREVE`)
y `fecha` (`AAAA-MM-DD`). Si no se elige visibilidad, queda `SOLO_SALUD` o `SOLO_EDUCACION` según el área
de quien la escribe. `GET /api/proyectos/{id}` incluye `puedeCargarNotas` para mostrar u ocultar «Agregar nota».

`AporteResponse` incluye `id`, `proyectoId`, `autorId`, `autorNombre` (nombre y apellido del autor, se mantiene aunque ya no sea miembro), `tipo`, `titulo`, `contenido`, `datos`,
`visibilidad`, `archivado`, `creadoEn`, `actualizadoEn`, `puedeEditar`, `archivoIds`, `archivos` y
`autorEspecialidades` (las especialidades que el autor declaró en el proyecto)
(true si el usuario es el autor y puede cargar en el proyecto).

## Configuración de cifrado

`contenido` y `datos`, tanto del aporte como de sus versiones, usan `CifradoConverter`
con AES-256-GCM. La variable `TRAMA_CRYPTO_KEY` debe contener 32 bytes aleatorios
codificados en Base64. No se guarda en archivos versionados ni se generan claves
automáticas durante el arranque.

En este entorno se configuró una clave persistente en el `.env` local ignorado por Git.
Reiniciar el backend permite cargarla. Conservar esa clave permite leer los aportes
guardados entre reinicios. En otros entornos debe provisionarse como variable de entorno.

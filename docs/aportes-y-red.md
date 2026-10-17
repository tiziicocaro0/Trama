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
5. «Red» abre los profesionales de Educación y Salud vinculados al proyecto, con nombre,
   apellido, rol y especialidad. Si no se informó especialidad, se indica expresamente.
6. «Datos personales» muestra nombre, apellido, apodo, fecha de nacimiento, colegio y grado
   guardados al crear el acompañamiento; esta vista es de consulta.
7. «Notas» permite agregar notas y editar las propias. Muestra fecha y hora de creación
   tomadas del servidor, en la zona horaria del navegador, y la última edición si cambió.

Los tres botones comparten estilo y navegación entre `/proyectos/:id/red`,
`/proyectos/:id/datos-personales` y `/proyectos/:id/notas`. La portada conserva sus seis
secciones originales; las notas se consultan por separado.

La vinculación o invitación de profesionales no forma parte de este cambio.

## API implementada

Todas estas rutas requieren JWT y verifican permisos mediante `PermisoService`.

| Método | Ruta | Contrato |
|---|---|---|
| GET | `/api/proyectos/{proyectoId}/aportes` | `{ aportes: AporteResponse[], puedeCrear: boolean }` |
| POST | `/api/proyectos/{proyectoId}/aportes` | Recibe `AporteRequest`; devuelve `201` con `AporteResponse` |
| PUT | `/api/proyectos/{proyectoId}/aportes/{aporteId}` | Recibe `AporteRequest`; devuelve el aporte actualizado |
| GET | `/api/proyectos/{proyectoId}/red` | Lista de `{ id, nombre, apellido, rol, especialidad }`; `id` corresponde a la membresía |

`AporteRequest` contiene `tipo`, `titulo` (obligatorio, hasta 150 caracteres),
`contenido` (opcional, hasta 10000 caracteres) y `visibilidad`.
Tipos habilitados: `FORTALEZA`, `INTERES`, `COMUNICACION`, `SENSORIAL`, `ESTRATEGIA`, `RUTINA`, `NOTA`.
No se permite cambiar el tipo de un aporte existente.

`AporteResponse` incluye `id`, `tipo`, `titulo`, `contenido`, `visibilidad`, `creadoEn`,
`actualizadoEn` y `puedeEditar`.

## Permisos y persistencia

- Solo miembros acceden al proyecto. Solo el autor puede editar su aporte y debe
  conservar el permiso de escritura del proyecto.
- Familiares respetan `familiarPuedeCargar`; profesionales respetan el límite gratuito
  ya implementado por `PermisoService`.
- Tutores ven todas las visibilidades; Salud y Educación ven `TODOS` y los aportes de
  su ámbito; familiares ven `TODOS`. El filtro se realiza en la consulta a la base.
- Aportes archivados no se listan ni se editan. Este cambio no agrega una acción de archivo.
- Cada edición conserva título, contenido y datos anteriores en `aporte_version`,
  dentro de la misma transacción. El historial no tiene una pantalla en este alcance.
- Se reutilizan las tablas existentes de V2. No hay migraciones ni dependencias nuevas.

## Configuración de cifrado

`contenido` y `datos`, tanto del aporte como de sus versiones, usan `CifradoConverter`
con AES-256-GCM. La variable `TRAMA_CRYPTO_KEY` debe contener 32 bytes aleatorios
codificados en Base64. No se guarda en archivos versionados ni se generan claves
automáticas durante el arranque.

En este entorno se configuró una clave persistente en el `.env` local ignorado por Git.
Reiniciar el backend permite cargarla. Conservar esa clave permite leer los aportes
guardados entre reinicios. En otros entornos debe provisionarse como variable de entorno.

# Faltantes del backend

Estado al 13/10/2026, rama `bd`. Compara las migraciones Flyway (`V1` a `V6`) con el código Java.

> **Los endpoints de este documento son una propuesta.** Salen de las tablas de las migraciones, de los números de historia que figuran en sus comentarios y de las reglas de `CONTEXTO.md`. Antes de programar cada uno, confirmalo con la tarjeta de Trello de la historia.

## Resumen

| Qué | Hecho | Falta |
|---|---|---|
| Tablas con entidad JPA | 5 de 23 | 18 tablas (16 entidades + 2 tablas intermedias que se mapean como relación) |
| Controladores | 1 (`AuthenticationController`) | todos los de negocio |
| Endpoints | 3 (`/api/auth/registro`, `/login`, `/yo`) | ~55 propuestos abajo, sin contar planes y licencias |
| `CifradoConverter` (historia 0.20) | no existe | necesario antes de las entidades con columnas cifradas |

## 1. Entidades

### Ya existen

| Tabla | Entidad | Repository |
|---|---|---|
| `usuario` | `entity/usuario/Usuario` | `UsuarioRepository` |
| `token_recuperacion` | `entity/usuario/TokenRecuperacion` | `TokenRecuperacionRepository` |
| `proyecto` | `entity/proyecto/Proyecto` | `ProyectoRepository` |
| `membresia` | `entity/membresia/Membresia` (+ `Rol`) | `MembresiaRepository` |
| `invitacion` | `entity/invitacion/Invitacion` (+ `EstadoInvitacion`) | `InvitacionRepository` |

### Faltan

Columnas marcadas con 🔒: van cifradas y necesitan `@Convert(converter = CifradoConverter.class)`.

#### V2 · Aportes (historias 3.0 a 3.4, 6.2)

| Tabla | Entidad a crear | Notas |
|---|---|---|
| `aporte` | `Aporte` | Enums nuevos: `TipoAporte` (INTERES, FORTALEZA, COMUNICACION, SENSORIAL, ESTRATEGIA, RUTINA, DESREGULACION, OBSERVACION, NOTA_PROFESIONAL, ABC, SUGERENCIA) y `Visibilidad` (TODOS, SOLO_TUTORES, SOLO_SALUD, SOLO_EDUCACION). 🔒 `contenido`, `datos` |
| `aporte_version` | `AporteVersion` | Una fila por edición. 🔒 `contenido`, `datos` |
| `confirmacion_aporte` | `ConfirmacionAporte` | Clave compuesta (`aporte_id`, `usuario_id`): usar `@EmbeddedId` o `@IdClass` |
| `comentario` | `Comentario` | 🔒 `texto` |
| `solicitud_revision` | `SolicitudRevision` | Enum `EstadoRevision` (PENDIENTE, REVISADA). 🔒 `motivo` |

#### V3 · Archivos (historias 0.3, 4.3)

| Tabla | Entidad a crear | Notas |
|---|---|---|
| `archivo` | `Archivo` | El contenido va cifrado en disco, no en la base. Solo PDF, JPG o PNG, hasta 5 MB |
| `aporte_archivo` | — (sin entidad) | Tabla intermedia: `@ManyToMany` desde `Aporte` |

`Proyecto.fotoArchivoId` hoy es un `UUID` suelto. Cuando exista `Archivo`, se puede pasar a relación `@ManyToOne`.

#### V4 · Calendario y reuniones (historias 5.0 a 5.6)

| Tabla | Entidad a crear | Notas |
|---|---|---|
| `evento` | `Evento` | Enum `TipoEvento` (COMUN, REUNION). Una reunión es un evento con `tipo = REUNION`. 🔒 `descripcion`, `acta` |
| `evento_excepcion` | `EventoExcepcion` | Cancela o modifica una ocurrencia puntual de un evento semanal |
| `evento_participante` | — (sin entidad) | Tabla intermedia: `@ManyToMany` desde `Evento` |
| `acuerdo` | `Acuerdo` | Pertenece a una reunión. El back valida que el evento sea `REUNION` |

#### V5 · Auditoría y notificaciones (historias 0.2, 6.0, 6.1, 8.0)

| Tabla | Entidad a crear | Notas |
|---|---|---|
| `registro_accion` | `RegistroAccion` | Enum `AccionRegistro` (CREAR, EDITAR, ARCHIVAR, VER, INVITAR, REVOCAR, ELIMINAR). Sin contenido sensible |
| `notificacion` | `Notificacion` | Texto sin contenido sensible ("Ana cargó una observación") |
| `preferencia_notificacion` | `PreferenciaNotificacion` | Clave compuesta (`usuario_id`, `tipo`) |

#### V6 · Planes y licencias (historias 9.0 a 9.3, pago simulado)

| Tabla | Entidad a crear | Notas |
|---|---|---|
| `suscripcion` | `Suscripcion` | La PK es `usuario_id`: usar `@MapsId` |
| `paquete` | `Paquete` | |
| `institucion` | `Institucion` | |
| `licencia_profesional` | `LicenciaProfesional` | |

> `CONTEXTO.md` pide definir con el equipo cómo funcionan las licencias antes de crear este módulo.

### Infraestructura que falta para las entidades

- **`CifradoConverter`** (historia 0.20): convierte texto ↔ bytes cifrados con AES-256-GCM, usando la clave de `TRAMA_CRYPTO_KEY`. Sin esto no se pueden mapear `aporte`, `aporte_version`, `comentario`, `solicitud_revision` ni `evento`.
- **Repositories** para cada entidad nueva.

## 2. Endpoints

### Ya existen

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/registro` | Crea un usuario |
| POST | `/api/auth/login` | Devuelve el token (bloquea tras 5 intentos) |
| GET | `/api/auth/yo` | Datos del usuario logueado |

### Faltan (propuesta)

En la columna **Permiso**:
- **Miembro**: `verificarMiembro`.
- **Admin**: `verificarAdmin`.
- **Editar**: `verificarPuedeEditar`.
- **Autor**: `verificarAutor` + `verificarMiembro`.
- **Logueado**: solo requiere token.

#### Cuenta

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| POST | `/api/auth/recuperar` | Pide el mail de recuperación (crea `TokenRecuperacion`) | público |
| POST | `/api/auth/restablecer` | Cambia la contraseña con el token | público |
| PUT | `/api/usuarios/yo` | Edita nombre y apellido | Logueado |
| PUT | `/api/usuarios/yo/password` | Cambia la contraseña (sube `tokenVersion`) | Logueado |

#### Proyectos (historias 1.2, 1.8, 1.10, 8.2)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/proyectos` | Mis proyectos (`findMisProyectos` ya existe en el repo) | Logueado |
| POST | `/api/proyectos` | Crea el proyecto con consentimiento; el creador queda TUTOR admin | Logueado |
| GET | `/api/proyectos/{proyectoId}` | Datos del niño | Miembro |
| PUT | `/api/proyectos/{proyectoId}` | Edita los datos del niño | Admin |
| PUT | `/api/proyectos/{proyectoId}/configuracion` | `familiarPuedeCargar`, `familiarVeNotas` | Admin |
| POST | `/api/proyectos/{proyectoId}/eliminacion` | Programa la eliminación | Admin |
| DELETE | `/api/proyectos/{proyectoId}/eliminacion` | Cancela la eliminación programada | Admin |

#### Membresías (historias 1.8, 1.9)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/proyectos/{proyectoId}/miembros` | Lista la red del niño | Miembro |
| PUT | `/api/proyectos/{proyectoId}/miembros/{membresiaId}` | Designa o quita co-tutor (`esAdmin`) | Admin |
| PUT | `/api/proyectos/{proyectoId}/miembros/yo` | Especialidad y matrícula propias (EDUCACION y SALUD) | Miembro |
| DELETE | `/api/proyectos/{proyectoId}/miembros/{membresiaId}` | Revoca el acceso | Admin |

#### Invitaciones (historia 1.3)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| POST | `/api/proyectos/{proyectoId}/invitaciones` | Invita por mail con un rol; vence a los 7 días | Admin |
| GET | `/api/proyectos/{proyectoId}/invitaciones` | Invitaciones pendientes y vigentes, ordenadas por vencimiento | Admin |
| DELETE | `/api/proyectos/{proyectoId}/invitaciones/{invitacionId}` | Cancela una invitación pendiente (queda `CANCELADA`) | Admin |
| GET | `/api/invitaciones/{token}` | Datos de la invitación antes de aceptar | Logueado |
| POST | `/api/invitaciones/{token}/aceptar` | Crea la membresía | Logueado (el mail tiene que coincidir) |

#### Aportes (historias 3.0 a 3.4)

El listado filtra por visibilidad **en la consulta**. Como `contenido` está cifrado, no se busca por texto con SQL.

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/proyectos/{proyectoId}/aportes?tipo=` | Aportes de una sección (o la bitácora: OBSERVACION + ABC) | Miembro + visibilidad |
| POST | `/api/proyectos/{proyectoId}/aportes` | Crea un aporte | Editar |
| GET | `/api/aportes/{aporteId}` | Detalle | Miembro + visibilidad |
| PUT | `/api/aportes/{aporteId}` | Edita y guarda una `AporteVersion` | Autor + Editar |
| POST | `/api/aportes/{aporteId}/archivar` | Archiva (nunca se borra) | Autor |
| GET | `/api/aportes/{aporteId}/versiones` | Historial de versiones | Miembro + visibilidad |

#### Confirmaciones, comentarios y revisiones (historias 3.x, 6.2)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| POST | `/api/aportes/{aporteId}/confirmaciones` | "Lo leí / estoy de acuerdo" (una por persona) | Miembro |
| DELETE | `/api/aportes/{aporteId}/confirmaciones` | Quita la confirmación propia | Miembro |
| GET | `/api/aportes/{aporteId}/comentarios` | Lista los comentarios | Miembro + visibilidad |
| POST | `/api/aportes/{aporteId}/comentarios` | Comenta | Miembro |
| POST | `/api/aportes/{aporteId}/solicitudes-revision` | Pide al autor que revise el aporte | Miembro |
| GET | `/api/proyectos/{proyectoId}/solicitudes-revision` | Pendientes de mis aportes | Miembro |
| POST | `/api/solicitudes-revision/{solicitudId}/revisada` | Marca como revisada | Autor del aporte |

#### Archivos (historias 0.3, 4.3)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| POST | `/api/proyectos/{proyectoId}/archivos` | Sube un archivo (multipart, cifrado en disco) | Editar |
| GET | `/api/archivos/{archivoId}` | Descarga (descifra) | Miembro |
| PUT | `/api/proyectos/{proyectoId}/foto` | Asigna la foto del niño | Admin |

#### Calendario y reuniones (historias 5.0 a 5.6)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/proyectos/{proyectoId}/eventos?desde=&hasta=` | Eventos del rango, con las recurrencias expandidas | Miembro |
| GET | `/api/proyectos/{proyectoId}/cambios` | Próximos eventos marcados como cambio (5.4) | Miembro |
| POST | `/api/proyectos/{proyectoId}/eventos` | Crea un evento o reunión | Editar |
| GET | `/api/eventos/{eventoId}` | Detalle | Miembro |
| PUT | `/api/eventos/{eventoId}` | Edita | Autor + Editar |
| DELETE | `/api/eventos/{eventoId}` | Elimina un evento (a confirmar: ¿se borra o se archiva?) | Autor |
| PUT | `/api/eventos/{eventoId}/excepciones/{fecha}` | Cancela o modifica una ocurrencia | Autor + Editar |
| PUT | `/api/eventos/{eventoId}/participantes` | Define los participantes | Autor |
| PUT | `/api/eventos/{eventoId}/acta` | Carga el acta (solo reuniones) | Autor |
| GET | `/api/eventos/{eventoId}/acuerdos` | Acuerdos de la reunión | Miembro |
| POST | `/api/eventos/{eventoId}/acuerdos` | Crea un acuerdo con responsable y fecha | Editar |
| PUT | `/api/acuerdos/{acuerdoId}` | Marca cumplido o edita | Responsable o autor (a confirmar) |

#### Registro de acciones (historias 0.2, 8.0)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/proyectos/{proyectoId}/registro?usuarioId=` | Quién hizo qué y cuándo | Admin |

Además, cada service que crea, edita, archiva, invita o revoca tiene que **escribir** en `registro_accion`.

#### Notificaciones (historias 6.0, 6.1)

| Método | Ruta | Qué hace | Permiso |
|---|---|---|---|
| GET | `/api/notificaciones` | Las últimas 10 (la campana) | Logueado |
| GET | `/api/notificaciones/no-leidas/count` | Contador de la campana (el front consulta cada 60 s) | Logueado |
| PUT | `/api/notificaciones/{id}/leida` | Marca como leída | Logueado (solo las propias) |
| PUT | `/api/notificaciones/leer-todas` | Marca todas como leídas | Logueado |
| GET | `/api/notificaciones/preferencias` | Qué tipos llegan también por mail (por defecto, todos) | Logueado |
| PUT | `/api/notificaciones/preferencias` | Cambia uno o varios tipos; la invitación no se puede apagar | Logueado |

Para avisar desde otra historia: `notificacionService.notificar(usuarios, proyectoId, TipoNotificacion.X.name(), texto, link)`.
El texto no lleva contenido sensible ni el nombre del niño, porque también puede salir por mail.
El mail sale después de confirmar la transacción y, si falla el correo, solo queda en el log.
Ya avisan: la nota profesional nueva (4.2), la invitación a alguien con cuenta (1.3) y el cambio de paquete (9.3).
Faltan, en sus historias: el cambio de calendario (5.4), la mención (6.2) y el pedido de revisión (3.4).

#### Planes y licencias (historias 9.0 a 9.3)

Pendiente de definir con el equipo (ver `CONTEXTO.md`). Como mínimo hará falta:
- Ver y contratar la suscripción propia (pago simulado).
- Listar paquetes.
- Que una institución asigne y quite licencias a profesionales.

## 3. Tareas programadas (no son endpoints)

| Tarea | Historia | Qué hace |
|---|---|---|
| Eliminar proyectos | 8.2 | Borra los proyectos con `eliminacion_programada` vencida (`findByEliminacionProgramadaBefore` ya existe) |
| Vencer invitaciones | 1.3 | Opcional: el listado y la aceptación ya ignoran las vencidas por `vence_en`. Solo dejaría el estado `VENCIDA` prolijo en la base |
| Avisar acuerdos vencidos | 5.x | Notifica los acuerdos no cumplidos con `fecha_revision` vencida y completa `avisado_en` |

## 4. Para cada módulo nuevo

Seguir la estructura de `CONTEXTO.md` (entidad, repository, service, controller y dto), y además:

- [ ] El service llama a `PermisoService` antes de leer o escribir.
- [ ] DTOs `record` de entrada y salida, con `@Valid`.
- [ ] Tests: caso bueno, caso de error y `403`.
- [ ] Si hay texto libre sobre el niño: `CifradoConverter`.

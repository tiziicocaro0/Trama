# Planes y licencias (9.0 a 9.3)

Trama es gratis para las familias, siempre. Los profesionales de educación y salud editan
gratis en hasta 2 niños; para editar en todos tienen una suscripción propia o una licencia
de una institución. El pago es **simulado**: hay flujo y pantalla, pero no se cobra ni se
guarda ninguna tarjeta. Los precios salen de la planilla de costos (0.13).

## 9.0 · Límite freemium del profesional

| Regla | Dónde vive |
|---|---|
| Un profesional (`EDUCACION` o `SALUD`) sin plan pago edita solo en sus **2 primeros proyectos** por fecha de alta de la membresía | `PermisoService.verificarPuedeEditar` |
| En el 3.º y los siguientes puede ver todo, pero cargar o editar responde **403 `SOLO_LECTURA`** | `SoloLecturaException` → `GlobalExceptionHandler` |
| "¿Edita sin límite?" (suscripción vigente; después, licencia institucional) | `PlanService.editaSinLimite`: única fuente |
| Tutores y familiares no tienen límite | No pasan por la regla del plan |

`GET /api/proyectos/{id}` suma `soloLecturaPorPlan`: `true` solo para el profesional que
está en solo lectura por el plan. Con eso el front muestra el aviso «Con el plan gratuito
podés editar en 2 niños. Suscribite para editar en todos.» en la cabecera de todas las
pantallas del niño. Los botones de carga ya se ocultaban con `puedeCargar`.

No hay endpoint `mi-acceso`: siguiendo el AGENTS.md, el dato se agregó al endpoint del
proyecto que el front ya consulta.

## 9.1 · Suscripción del profesional

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/suscripcion` | Plan del usuario: `esProfesional`, `plan` (`GRATUITO`, `MENSUAL`, `SEMESTRAL`), `desde`, `hasta`, `proyectosGratuitos` y los precios (`planes`) |
| POST | `/api/suscripcion` | `{ "periodo": "MENSUAL" \| "SEMESTRAL" }`: activa el plan sin pasarela (pago simulado). `409 YA_SUSCRIPTO` si ya hay uno vigente |
| DELETE | `/api/suscripcion` | Cancela en el momento: vuelve al límite de 2 niños. `404 SIN_SUSCRIPCION` si no había |

- Precios: mensual **$4.500** y semestral **$24.000** (`PeriodoSuscripcion`). El front los muestra desde la API, no los repite.
- `hasta` = hoy + 1 o 6 meses. Al vencer, `PlanService` deja de considerarla vigente y vuelve el límite. No hay renovación automática (no hay cobro real).
- Migración `V202610301130__suscripcion_periodo.sql`: columna `periodo` con su `CHECK` (cubierto por `ContratoBaseDeDatosTest`).
- Front: página `/cuenta/plan` (link «Mi plan» en el menú lateral). Las familias ven «Trama es gratis para las familias, siempre» y ningún precio. El pago pasa por `PagoSimulado`: muestra concepto, total y «Mercado Pago (simulado)» con la leyenda «Pago de prueba»; no pide tarjeta.
- El aviso de la 9.0 suma el link «Ver planes».

## 9.2 · Paquete institucional

Cualquier usuario puede contratar un paquete desde `/institucion` y queda como **responsable**
(uno por usuario). El responsable asocia y quita profesionales por email; **no tiene acceso a
ningún proyecto**: la respuesta solo trae cupos y la lista de profesionales.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/institucion` | `{ institucion, paquetes }`: la institución del usuario (o `null`) y los paquetes de menor a mayor |
| POST | `/api/institucion` | `{ nombre, paqueteId }`: contrata con pago simulado. `409 YA_ES_RESPONSABLE`, `404 PAQUETE_NO_ENCONTRADO` |
| POST | `/api/institucion/profesionales` | `{ email }`: asocia. `404 EMAIL_NO_REGISTRADO` (tiene que crear su cuenta primero), `409 YA_ASOCIADO`. Si supera un cupo, cambia de paquete (9.3) |
| DELETE | `/api/institucion/profesionales/{licenciaId}` | Quita la licencia. `404 LICENCIA_NO_ENCONTRADA` si no es de tu institución |

| Paquete | Niños | Profesionales | Precio por mes |
|---|---|---|---|
| Inicial | 15 | 5 | $18.000 |
| Intermedio | 40 | 15 | $45.000 |
| Red | sin límite | sin límite | $90.000 |

- **La licencia cubre todos los niños del profesional**: `PlanService.editaSinLimite` devuelve `true` con licencia vigente, igual que con suscripción.
- **Niños cubiertos** = proyectos distintos donde un profesional con licencia trabaja como educación o salud.
- `GET /api/suscripcion` suma `esResponsable`, `institucion` y el plan `INSTITUCIONAL`.
- Migración `V202610301200__paquetes_institucionales.sql`: cupos nullables (null = sin límite), un responsable por institución y los 3 paquetes.
- Front: `/institucion` (contratar con `PagoSimulado`, panel con cupos y profesionales). Se llega desde «Mi plan».

## 9.3 · Cambio automático de paquete

Cuando una institución supera el cupo de niños o de profesionales, **pasa sola al paquete
siguiente** (por precio) hasta que entre. El último (Red) no tiene límite, así que nunca se
bloquea a nadie.

| Cuándo se revisa | Dónde |
|---|---|
| Al asociar un profesional | `InstitucionService.asociar` |
| Cuando un profesional con licencia acepta la invitación a un niño nuevo | `InvitacionService.aceptarInvitacion` → `InstitucionService.revisarCuposDe` |

- El aviso queda guardado en la institución (`aviso_paquete_anterior`, `aviso_motivo` = `NINOS` o `PROFESIONALES`) y viaja en `InstitucionResponse.aviso`.
- `PUT /api/institucion/aviso` lo cierra.
- Front: cartel flotante en `/institucion` con la etiqueta **«Aviso de prueba»**.
- Migración `V202610301530__aviso_cambio_paquete.sql` (su `CHECK` está cubierto por `ContratoBaseDeDatosTest`).

> **Pendiente para cuando se mergee la 6.0:** reemplazar el cartel de prueba por una notificación
> real (`NotificacionService.notificar(...)`) al responsable y sacar el cartel.

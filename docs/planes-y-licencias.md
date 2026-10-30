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

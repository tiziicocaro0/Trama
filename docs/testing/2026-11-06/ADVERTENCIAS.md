# Advertencias y cambios a realizar

[← Volver al resumen](README.md) · Detalle de cada arreglo: [remediacion.md](remediacion.md)

> **Pruebas del 5 y 6 de noviembre de 2026.** Cada hallazgo se volvió a verificar contra `develop` el 9 de noviembre de 2026: **todos siguen presentes** (Spring Boot 3.1.11, puertos publicados en todas las interfaces, demo con perfil `dev`, errores 500 sin registrar, contraseña sin largo máximo, listas sin paginar, sin límite de pedidos por IP).

## Lo más importante

- **El límite real es cuántos aportes tiene cada niño, no la cantidad de usuarios.** La lista de aportes y la bitácora no están paginadas: con 1.000 aportes abrir un perfil tarda 3,7 s y con 20.000 el backend deja de responder ([casos-limite.md](casos-limite.md#niños-con-muchos-aportes)).
- **Lo que satura es una cadena:** BCrypt en el login, la conexión a la base retenida durante el login (Open Session In View) y un pool de solo 10 conexiones. Cuando se juntan, todos los pedidos hacen cola ([rendimiento.md](rendimiento.md#qué-satura-a-trama)).
- **Para empezar alcanza un VPS de 1 CPU y 2 GB.** El de 1 GB no sirve: MySQL no arranca con el compose actual.

## Cambios chicos (pendientes)

Se pueden hacer de a uno, sin tocar reglas de negocio. Cada uno con sus tests y la suite completa antes del PR.

| # | Cambio | Por qué | Tamaño | Hallazgo |
|---|---|---|---|---|
| 1 | Registrar en el log los errores 500 en `GlobalExceptionHandler.handleUnexpected`, sin datos del niño | Hoy los errores de producción no dejan rastro (así quedaron ocultos 806 errores de memoria en las subidas) | 1 archivo | C3 |
| 2 | Ediciones simultáneas del mismo aporte: responder `409` con un mensaje claro en lugar de `500` | Un doble clic en "Guardar" muestra "Ocurrió un error inesperado". No se pierden datos | 1 archivo y su test | Casos límite |
| 3 | Publicar MySQL y el backend solo en `127.0.0.1` (`"127.0.0.1:3307:3306"`, `"127.0.0.1:4002:8080"`) | En un VPS quedarían abiertos a internet: Docker se saltea el firewall | 2 líneas del compose | D1 |
| 4 | Largo máximo de la contraseña (`@Size(max = 72)`) en `RegisterRequest` y `RestablecerContrasenaRequest` | BCrypt solo compara los primeros 72 bytes (CVE-2025-22228). Ojo: son bytes, una letra con tilde ocupa 2 | 2 archivos | C6 |
| 5 | Rotación de logs de Docker (`max-size: "10m"`, `max-file: "5"`) en cada servicio | Hoy crecen sin límite, y con el disco lleno TRAMA se cae entera | compose | D3 |
| 6 | Paliativo para las subidas: `-Djdk.nio.maxCachedBufferSize=262144` en las opciones de Java | Después de un pico, entre el 26 % y el 75 % de las subidas fallan hasta reiniciar el backend | 1 línea | Casos límite |
| 7 | `X-Content-Type-Options: nosniff` en la foto de perfil | El comprobante ya lo tiene; la foto no | 1 archivo | C8 |
| 8 | Que el filtro JWT valide el token una sola vez (hoy lo hace tres veces) | Es entre el 11 % y el 24 % de la CPU de cada pedido | 1 o 2 archivos | Rendimiento |
| 9 | Traer los adjuntos de los aportes en una sola consulta (sin N+1) | Hoy hace una consulta por aporte | repository y service | Rendimiento |
| 10 | `spring.jpa.open-in-view=false` | Es lo que hace que el login retenga la conexión durante BCrypt. Puede romper servicios que leen datos fuera de su transacción: correr la suite completa | 1 línea y revisión | Rendimiento |

## Cambios grandes (para decidir con el equipo)

| Cambio | Por qué es grande |
|---|---|
| **Paginar `GET /aportes` y la bitácora** | Es lo más importante del informe, pero cambia la API: hay que adaptar el front, el resumen ("Conocelo en 5 minutos") y la exportación de datos (8.1) |
| **Actualizar Spring Boot 3.1 a una versión con soporte** | Resuelve la mayoría de las 13 vulnerabilidades críticas de la imagen del backend, pero es un cambio de versión mayor: rama propia, suite completa y repetir estas pruebas |
| **Subir y bajar archivos por partes** (*streaming*) | Es la solución de fondo del cambio chico 6. Reescribe `ArchivoService` |
| **Límite de pedidos por IP** en login, registro y recuperación | Frena la fuerza bruta, el bloqueo de cuentas ajenas y el abuso de mails. Requiere nginx (`limit_req`) o una dependencia nueva |
| **Cifrar el título de los aportes** (`aporte.titulo`, `aporte_version.titulo`) | Lo pide la regla de cifrar todo texto libre sobre el niño. Es un cambio de esquema y hay que migrar los títulos existentes |
| **Demo pública sin `DataSeeder`** | Hoy cualquiera entra a la demo con las cuentas de prueba y `Trama1234!`. Coordinar con quien mantiene la demo (#74) |
| Enumeración de emails por tiempo de respuesta, revocar tokens al cambiar la contraseña, mails en segundo plano | Cada uno toca varias piezas del login |

## A tener en cuenta

- **El backend no admite más de una copia corriendo.** Los archivos se guardan en el disco local y las tareas programadas (por ejemplo, el aviso diario de acuerdos vencidos de la 5.6) se ejecutarían una vez por copia. Ver [escalabilidad.md](escalabilidad.md).
- **Disco lleno = TRAMA caída y sin recuperación automática.** Antes de producción: alerta al 80 %, rotación de backups y binlogs con menos retención. Ver [capacidad-50gb.md](capacidad-50gb.md).

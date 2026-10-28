# OpenBao: claves de cifrado en un KMS

> **Estado:** implementado en la rama `feature/0.3-openbao`. Cumple el criterio de la 0.3 *"Las claves de cifrado deben almacenarse y administrarse mediante un KMS"*.

## Por qué existe

TRAMA cifra los datos sensibles de los niños con dos claves:

| Clave | Para qué |
|---|---|
| `TRAMA_CRYPTO_KEY` | Los campos sensibles de la base y los archivos adjuntos (0.20 y 0.3) |
| `TRAMA_BACKUP_KEY` | Los backups de la base y los archivos (0.3) |

Antes vivían solo en el `.env`. Un KMS (*Key Management System*) las guarda cifradas, decide quién puede leerlas, registra cada acceso y permite rotarlas. Elegimos **OpenBao**: es la versión open source de Vault (Linux Foundation) y corre como un contenedor más del compose. AWS KMS, Google Cloud KMS y Azure Key Vault quedaron descartados porque no hay infraestructura en la nube; HashiCorp Vault, porque su licencia ya no es open source.

## Cómo está armado

Cada pieza en su contenedor, cada una con su volumen:

```
docker compose
├── trama-openbao   ── volumen trama-openbao-data  (las claves, cifradas por OpenBao)
│        ▲
│        │ token de solo lectura (OPENBAO_TOKEN)
├── trama-backend   (perfil prod: pide las claves a OpenBao al arrancar)
├── backup          (pide TRAMA_BACKUP_KEY a OpenBao en cada backup)
└── trama-mysql     ── volumen trama-mysql-data
```

| Archivo | Qué hace |
|---|---|
| `openbao/config.hcl` | Servidor real (no "modo dev"): almacenamiento `raft` en `/openbao/file` (el volumen), puerto 8200, sin interfaz web |
| `openbao/inicializar.sh` | Se corre **una sola vez** por entorno: crea la caja fuerte, carga las claves y crea el token del backend |
| `openbao/abrir.sh` | Se corre **cada vez que se reinicia** el contenedor: lo abre y renueva el token del backend |
| `openbao/nuevo-token.sh` | Solo si el token del backend venció: crea uno nuevo y lo reemplaza en el `.env` |
| `backup/clave.sh` | Lo usan `backup.sh` y `restaurar.sh` para pedir `TRAMA_BACKUP_KEY` a OpenBao |
| `docker-compose.yml` | Servicio `openbao` (imagen `openbao/openbao:2.7.2`, perfiles `app` y `backup`). El backend y el backup esperan a que esté abierto |
| `backend/pom.xml` | Dependencia `spring-cloud-starter-vault-config` (Spring Cloud 2022.0.5, compatible con Spring Boot 3.1) |
| `application.properties` | `spring.cloud.vault.enabled=false`: **apagado por defecto** |
| `application-prod.yml` | Encendido en `prod`: `spring.config.import: vault://secret/trama` |

## Qué hay dentro de OpenBao

| Qué | Dónde | Para qué |
|---|---|---|
| `TRAMA_CRYPTO_KEY` y `TRAMA_BACKUP_KEY` | `secret/trama` (almacén `kv-v2`) | Las mismas claves del `.env`, así lo ya cifrado sigue legible |
| Política `trama-lectura` | — | Permite **solo leer** `secret/trama`. Nada más: ni escribir, ni ver otras rutas, ni administrar |
| Token del backend | `OPENBAO_TOKEN` en el `.env` | Tiene la política `trama-lectura`. Dura 32 días y se renueva sin límite de veces |

## Cómo funciona

### El backend

- **En Docker (perfil `prod`):** al arrancar, antes que todo lo demás, Spring lee `secret/trama` de OpenBao y suma sus valores a la configuración. `CryptoService` sigue usando `@Value("${TRAMA_CRYPTO_KEY}")` sin ningún cambio en el código Java. El contenedor **no** recibe `TRAMA_CRYPTO_KEY` en su entorno: si la recibiera, Spring la usaría antes que la de OpenBao y el KMS quedaría de adorno.
- **Si OpenBao está sellado o no responde**, el backend no arranca (`fail-fast`) y lo dice en el log: `Vault is sealed`. Docker lo reintenta solo, y arranca apenas se abre OpenBao.
- **Desde el IDE, con `./mvnw`, en los tests y en el CI** (perfiles `dev` y `test`), OpenBao está apagado y las claves salen del `.env`. Nadie necesita OpenBao para desarrollar.

### El backup

`clave.sh` pide `TRAMA_BACKUP_KEY` a la API de OpenBao con `curl` (la imagen de MySQL no trae el programa `bao`). Si OpenBao está sellado, el backup se frena antes de crear ningún archivo. Los backups hechos antes de OpenBao se siguen restaurando: la clave es la misma.

### El sellado

OpenBao guarda todo cifrado en su volumen y **arranca sellado**: tiene las claves, pero no las entrega hasta que alguien lo abre con la **clave de apertura**. Así funciona un KMS real. En el día a día:

| Momento | Qué hacer |
|---|---|
| Primera vez en un entorno | `docker compose --profile app up -d openbao` y después `sh openbao/inicializar.sh` |
| Después de reiniciar la Mac, Docker o el contenedor | `sh openbao/abrir.sh`. El backend arranca solo cuando OpenBao queda abierto |
| `abrir.sh` avisa que el token venció | `sh openbao/nuevo-token.sh` y después `docker compose --profile app up -d --force-recreate backend` |

El healthcheck del compose marca OpenBao como saludable **solo cuando está abierto**. Tarda hasta unos 30 segundos en notar un sellado: por eso `clave.sh` también lo verifica.

### El token del backend

Es un token **periódico** de 32 días: cada renovación vuelve el contador a 32 días, sin límite de renovaciones (no tiene tope de vida total). Spring **no** lo renueva solo: lo renueva `abrir.sh` cada vez que abre OpenBao. Solo vence si pasan más de 32 días sin abrirlo, y para eso está `nuevo-token.sh`.

## Qué queda en el `.env`

| Variable | Qué es | Quién la usa |
|---|---|---|
| `TRAMA_CRYPTO_KEY` / `TRAMA_BACKUP_KEY` | Las claves de cifrado | El IDE, los tests, el CI, `inicializar.sh` |
| `OPENBAO_UNSEAL_KEY` | Clave de apertura | `abrir.sh` |
| `OPENBAO_ROOT_TOKEN` | Token de administrador: puede hacer cualquier cosa en OpenBao | `nuevo-token.sh` |
| `OPENBAO_TOKEN` | Token de solo lectura del backend | El backend en Docker, el backup, `abrir.sh` |

## Reglas para el equipo

- ⚠️ **El `.env` es el archivo más delicado del proyecto:** tiene la llave de todo. Nunca se sube ni se comparte.
- ⚠️ **`docker compose down -v` borra el volumen de OpenBao.** Las claves siguen en el `.env`, así que se recupera volviendo a correr `inicializar.sh` (previo borrar las líneas `OPENBAO_*` del `.env`).
- **`TRAMA_CRYPTO_KEY` no se cambia nunca sola:** tiene que ser la misma en el `.env` y en OpenBao. Si difieren, el backend del IDE y el de Docker cifran con claves distintas y no pueden leer los datos del otro.
- **Las claves nunca pasan como argumento de un comando:** los scripts las mandan por la entrada estándar, así no quedan en el historial ni en la lista de procesos.

## Modo local vs. producción

Esta configuración es para entornos locales. En un servidor real hay que cambiar:

| Local (hoy) | Producción |
|---|---|
| Clave de apertura en el `.env` (modo práctico) | Solo en manos de una persona, en un gestor de contraseñas, o apertura automática con un KMS de la nube |
| Token de administrador en el `.env` | Fuera del servidor, solo para tareas de administración |
| HTTP sin TLS (`tls_disable = true`) | HTTPS con certificado |
| Una clave de apertura (`-key-shares=1`) | Varias, repartidas entre personas (por ejemplo, 3 de 5) |

## Cambios respecto de la propuesta original

| Propuesta | Implementación | Por qué |
|---|---|---|
| Almacenamiento `file` | `raft` | OpenBao 2 eliminó `file` |
| `spring.config.import: vault://` | `vault://secret/trama` | Con la ruta genérica Spring también pedía `secret/trama/prod`, y el token (con permiso mínimo) recibía 403 |
| Clave de apertura en un gestor de contraseñas | En el `.env` (modo práctico) | Decisión del equipo para entornos locales |
| Renovación del token por Spring | Por `abrir.sh` | Spring no renueva un token fijo |

## Cómo se probó

- El backend en Docker arranca **sin `TRAMA_CRYPTO_KEY` en su entorno**, cifra un aporte al guardarlo y lo descifra al leerlo. En MySQL el contenido queda ilegible.
- Con OpenBao sellado el backend no arranca y lo explica; al abrirlo, arranca solo.
- El token del backend lee `secret/trama`, pero no puede escribir ni ver otras rutas. `abrir.sh` lo renueva a 32 días; `nuevo-token.sh` crea uno nuevo y anula el anterior.
- El backup se cifra con la clave de OpenBao y se restaura con el contenido idéntico. Con OpenBao sellado no se hace y no deja archivos a medias.
- `./mvnw test`: pasan los 102 tests (OpenBao apagado fuera de `prod`).

## Posibles mejoras

- Mover también `JWT_SECRET` a OpenBao: es agregarlo a `secret/trama` y sacarlo del compose, sin tocar código.
- Rotar `TRAMA_CRYPTO_KEY`: requiere volver a cifrar los datos existentes con la clave nueva. Es una historia propia.

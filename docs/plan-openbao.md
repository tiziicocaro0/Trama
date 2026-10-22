# Plan: claves de cifrado en OpenBao (KMS)

> **Estado:** propuesta, todavía no implementada. Corresponde al criterio de la 0.3 *"Las claves de cifrado deben almacenarse y administrarse mediante un KMS"*.
> Antes de implementarla hay que cerrar las decisiones de la última sección.

## El problema

Hoy las claves de TRAMA viven en el `.env` de cada entorno:

| Clave | Para qué |
|---|---|
| `TRAMA_CRYPTO_KEY` | Cifrar los campos sensibles de la base y los archivos adjuntos (0.20 y 0.3) |
| `TRAMA_BACKUP_KEY` | Cifrar los backups de la base y los archivos (0.3) |

Una variable de entorno cumple "la clave no está en el repo", pero no es un KMS (*Key Management System*). Un KMS guarda las claves cifradas, controla quién puede leerlas, registra cada acceso y permite rotarlas.

## Opciones evaluadas

| Opción | Qué es | Para TRAMA |
|---|---|---|
| AWS KMS / Google Cloud KMS / Azure Key Vault | KMS en la nube | Descartado por ahora: requiere una cuenta en la nube y que la app corra ahí. No hay infraestructura de producción definida |
| HashiCorp Vault | KMS que corre en un contenedor propio | Descartado: desde 2023 su licencia no es open source |
| **OpenBao** | Copia open source de Vault (Linux Foundation) | **Elegido.** Corre como un contenedor más del compose y es compatible con las librerías de Vault |
| Docker secrets | Archivos con secretos montados en el contenedor | Descartado: no es un KMS, no rota ni audita |

## Cómo quedaría

Sigue la idea del compose: **cada pieza en su contenedor**.

```
docker compose
├── trama-openbao  ──► volumen trama-openbao-data (claves, cifradas por OpenBao)
│        ▲
│        │ token de solo lectura
├── trama-backend   (perfil prod: pide las claves a OpenBao al arrancar)
├── trama-mysql
└── backup          (pide TRAMA_BACKUP_KEY a OpenBao)
```

**`CryptoService` y `CifradoConverter` no cambian.** Spring Cloud Vault carga las claves de OpenBao como propiedades de Spring, así que `@Value("${TRAMA_CRYPTO_KEY}")` sigue funcionando igual.

## Archivos que se tocarían (unos 12)

| Archivo | Cambio |
|---|---|
| `docker-compose.yml` | Servicio `openbao` con su volumen. El backend y el backup reciben la dirección de OpenBao y un token |
| `openbao/config.hcl` | Configuración del servidor: guarda en disco (el volumen), no en memoria |
| `openbao/politica-backend.hcl` | Permiso de **solo lectura** a las claves de TRAMA, nada más |
| `openbao/inicializar.sh` | Se corre **una sola vez**: inicializa OpenBao, carga las claves y crea el token del backend |
| `backend/pom.xml` | **Dependencia nueva:** `spring-cloud-starter-vault-config`, con el BOM de Spring Cloud 2022.0.x, compatible con Spring Boot 3.1 |
| `application-prod.yml` | `spring.config.import: vault://` y la conexión a OpenBao |
| `application.properties` | `spring.cloud.vault.enabled=false` por defecto: dev, tests y CI siguen con el `.env` |
| `backup/backup.sh` y `backup/restaurar.sh` | Leen `TRAMA_BACKUP_KEY` desde OpenBao |
| `.env.example`, `.gitignore`, `README.md` | Documentación y variables |

## Lo que hay que saber antes de decidir

1. **Es una dependencia Maven nueva.** Según `AGENTS.md` y `CONTEXTO.md`, la tiene que aprobar el equipo (Ana para el back).
2. **OpenBao arranca "sellado".** Así funciona un KMS real: cada vez que se reinicia el contenedor, alguien tiene que abrirlo con una **clave de apertura** (`bao operator unseal`).
   - Esa clave y el token de administrador se generan una sola vez, en `inicializar.sh`, y **hay que guardarlos fuera del repo**, por ejemplo en un gestor de contraseñas.
   - Si se pierden, se pierden las claves de TRAMA, y con ellas todo lo que está cifrado.
3. **El "modo dev" de OpenBao no cumple el criterio.** Arranca abierto y sin pasos, pero guarda todo en memoria: al reiniciar se pierden las claves. Sirve solo para una demostración.
4. **Aplica solo al perfil `prod` (Docker).** Desde el IDE, con `./mvnw`, en los tests y en el CI se sigue usando el `.env`. Nadie necesita OpenBao para desarrollar.

## Decisiones pendientes

| # | Decisión | Recomendación |
|---|---|---|
| 1 | ¿Servidor real (sellado, guarda en disco) o modo dev (en memoria)? | **Servidor real.** Es lo que cumple el criterio |
| 2 | ¿El backend se autentica con un token simple o con AppRole? | **Token de solo lectura.** Es más simple y alcanza para un entorno local |
| 3 | ¿El equipo aprueba la dependencia `spring-cloud-starter-vault-config`? | Consultarlo con Ana antes de empezar |
| 4 | ¿Va en el mismo PR que la 0.3 o en uno aparte? | Si va junto, el PR suma unos 20 archivos: separar la descripción en 0.3, backups y OpenBao |

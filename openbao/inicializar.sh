#!/bin/sh
# Inicializa OpenBao, el KMS de TRAMA (0.3). Se corre UNA sola vez por entorno:
#
#   docker compose --profile app up -d openbao
#   sh openbao/inicializar.sh
#
# Carga TRAMA_CRYPTO_KEY y TRAMA_BACKUP_KEY del .env en OpenBao y deja en el .env
# la clave de apertura, el token de administrador y el token de solo lectura del backend.
# Ver docs/plan-openbao.md.
set -eu

cd "$(dirname "$0")/.."      # raíz del repo, donde está el .env
ENV=.env

leer() { grep "^$1=" "$ENV" | head -1 | cut -d= -f2-; }

CRYPTO=$(leer TRAMA_CRYPTO_KEY)
BACKUP=$(leer TRAMA_BACKUP_KEY)
[ -n "$CRYPTO" ] && [ -n "$BACKUP" ] \
    || { echo "Faltan TRAMA_CRYPTO_KEY o TRAMA_BACKUP_KEY en el .env" >&2; exit 1; }

if grep -q '^OPENBAO_' "$ENV"; then
    echo "El .env ya tiene datos de OpenBao: no se vuelve a inicializar." >&2
    exit 1
fi

if docker exec trama-openbao bao status 2>/dev/null | grep -q 'Initialized *true'; then
    echo "OpenBao ya está inicializado." >&2
    exit 1
fi

echo "1/5 Inicializando OpenBao..."
SALIDA=$(docker exec trama-openbao bao operator init -key-shares=1 -key-threshold=1)
CLAVE=$(echo "$SALIDA" | awk -F': ' '/Unseal Key 1/ {print $2}')
ROOT=$(echo "$SALIDA" | awk -F': ' '/Initial Root Token/ {print $2}')

# Se guardan enseguida: si algo falla después, no se pierden.
printf '\n# OpenBao (KMS, 0.3): generado por openbao/inicializar.sh. NUNCA compartir.\n' >> "$ENV"
printf 'OPENBAO_UNSEAL_KEY=%s\nOPENBAO_ROOT_TOKEN=%s\n' "$CLAVE" "$ROOT" >> "$ENV"

echo "2/5 Abriendo OpenBao..."
# Por la API y por la entrada estándar: la clave no queda en ningún argumento ni historial.
printf '{"key":"%s"}' "$CLAVE" \
    | curl -sf -X PUT --data @- http://127.0.0.1:8200/v1/sys/unseal > /dev/null

admin() { docker exec -i -e BAO_TOKEN="$ROOT" trama-openbao bao "$@"; }

echo "3/5 Cargando las claves de TRAMA..."
admin secrets enable -path=secret kv-v2 > /dev/null
printf '{"TRAMA_CRYPTO_KEY":"%s","TRAMA_BACKUP_KEY":"%s"}' "$CRYPTO" "$BACKUP" \
    | admin kv put secret/trama - > /dev/null

echo "4/5 Creando el permiso de solo lectura y el token del backend..."
printf 'path "secret/data/trama" {\n  capabilities = ["read"]\n}\n' \
    | admin policy write trama-lectura - > /dev/null
TOKEN=$(admin token create -policy=trama-lectura -orphan -period=768h \
    -display-name=trama-backend -field=token)
printf 'OPENBAO_TOKEN=%s\n' "$TOKEN" >> "$ENV"

echo "5/5 Verificando que el token del backend lee las claves..."
LEIDA=$(docker exec -e BAO_TOKEN="$TOKEN" trama-openbao bao kv get -field=TRAMA_CRYPTO_KEY secret/trama)
[ "$LEIDA" = "$CRYPTO" ] || { echo "La clave leída no coincide" >&2; exit 1; }

echo "Listo: OpenBao quedó inicializado, abierto y con las claves de TRAMA."
echo "En el .env quedaron OPENBAO_UNSEAL_KEY, OPENBAO_ROOT_TOKEN y OPENBAO_TOKEN."

#!/bin/sh
# Crea un token nuevo para el backend cuando el anterior venció (0.3) y lo
# reemplaza en el .env. Usa el token de administrador (OPENBAO_ROOT_TOKEN).
#
#   sh openbao/abrir.sh          (abre OpenBao; va a avisar que el token venció)
#   sh openbao/nuevo-token.sh
set -eu

cd "$(dirname "$0")/.."      # raíz del repo, donde está el .env
API=http://127.0.0.1:8200/v1

leer() { grep "^$1=" .env | head -1 | cut -d= -f2-; }

ROOT=$(leer OPENBAO_ROOT_TOKEN)
VIEJO=$(leer OPENBAO_TOKEN)
[ -n "$ROOT" ] || { echo "Falta OPENBAO_ROOT_TOKEN en el .env." >&2; exit 1; }

curl -sf "$API/sys/seal-status" | grep -q '"sealed":false' \
    || { echo "OpenBao está sellado o no responde. Primero corré: sh openbao/abrir.sh" >&2; exit 1; }

echo "1/3 Creando el token nuevo (solo lectura de secret/trama, 32 días renovables)..."
NUEVO=$(docker exec -e BAO_TOKEN="$ROOT" trama-openbao bao token create \
    -policy=trama-lectura -orphan -period=768h -display-name=trama-backend -field=token)

echo "2/3 Verificando que lee las claves..."
docker exec -e BAO_TOKEN="$NUEVO" trama-openbao bao kv get -field=TRAMA_CRYPTO_KEY secret/trama > /dev/null

echo "3/3 Reemplazándolo en el .env y anulando el anterior..."
sed "s|^OPENBAO_TOKEN=.*|OPENBAO_TOKEN=$NUEVO|" .env > .env.nuevo && mv .env.nuevo .env
# Si el anterior todavía servía, se anula para que no quede uno suelto.
[ -z "$VIEJO" ] || printf 'X-Vault-Token: %s\n' "$VIEJO" \
    | curl -s -X POST -H @- "$API/auth/token/revoke-self" > /dev/null || true

echo "Listo. Para que el backend en Docker tome el token nuevo:"
echo "  docker compose --profile app up -d --force-recreate backend"

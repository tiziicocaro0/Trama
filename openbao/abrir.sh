#!/bin/sh
# Abre (unseal) OpenBao después de cada reinicio del contenedor y renueva el
# token del backend por 32 días más (0.3).
# Modo práctico, SOLO para entornos locales: usa OPENBAO_UNSEAL_KEY del .env.
# En producción la clave de apertura no se guarda en un archivo.
#
#   sh openbao/abrir.sh
set -eu

cd "$(dirname "$0")/.."      # raíz del repo, donde está el .env
API=http://127.0.0.1:8200/v1

leer() { grep "^$1=" .env | head -1 | cut -d= -f2-; }

CLAVE=$(leer OPENBAO_UNSEAL_KEY)
TOKEN=$(leer OPENBAO_TOKEN)
[ -n "$CLAVE" ] && [ -n "$TOKEN" ] \
    || { echo "Faltan datos de OpenBao en el .env. ¿Corriste openbao/inicializar.sh?" >&2; exit 1; }

ESTADO=$(curl -sf "$API/sys/seal-status") \
    || { echo "OpenBao no responde. Levantalo con: docker compose --profile app up -d openbao" >&2; exit 1; }

case "$ESTADO" in
    *'"initialized":false'*)
        echo "OpenBao no está inicializado. Corré: sh openbao/inicializar.sh" >&2; exit 1 ;;
    *'"sealed":true'*)
        # Por la entrada estándar: la clave no queda en ningún argumento ni historial.
        printf '{"key":"%s"}' "$CLAVE" \
            | curl -sf -X PUT --data @- "$API/sys/unseal" > /dev/null \
            || { echo "No se pudo abrir OpenBao: la clave del .env no coincide." >&2; exit 1; }
        echo "OpenBao abierto." ;;
    *)
        echo "OpenBao ya estaba abierto." ;;
esac

# El token del backend vence si pasan 32 días sin renovarlo: cada apertura lo renueva.
# Se renueva a sí mismo, sin el token de administrador. Va por la entrada estándar.
printf 'X-Vault-Token: %s\n' "$TOKEN" \
    | curl -sf -X POST -H @- "$API/auth/token/renew-self" > /dev/null \
    || { echo "El token del backend venció o no es válido. Corré: sh openbao/nuevo-token.sh" >&2; exit 1; }

echo "Token del backend renovado por 32 días."

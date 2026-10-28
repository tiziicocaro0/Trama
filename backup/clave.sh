# Pide TRAMA_BACKUP_KEY a OpenBao (KMS, 0.3). Lo usan backup.sh y restaurar.sh.
# El token va por la entrada estándar: no queda en ningún argumento.
: "${OPENBAO_URI:?Falta OPENBAO_URI}"
: "${OPENBAO_TOKEN:?Falta OPENBAO_TOKEN}"

TRAMA_BACKUP_KEY=$(printf 'X-Vault-Token: %s\n' "$OPENBAO_TOKEN" \
    | curl -sf -H @- "$OPENBAO_URI/v1/secret/data/trama" \
    | sed -n 's/.*"TRAMA_BACKUP_KEY":"\([^"]*\)".*/\1/p') || true

[ -n "$TRAMA_BACKUP_KEY" ] || {
    echo "No se pudo leer TRAMA_BACKUP_KEY de OpenBao. ¿Está abierto? Corré: sh openbao/abrir.sh" >&2
    exit 1
}

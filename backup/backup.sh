#!/bin/sh
# Backup cifrado de TRAMA (0.3): la base y los archivos adjuntos juntos, en un solo
# archivo cifrado con AES-256 (gpg). Corre dentro del servicio "backup" del compose:
#
#   docker compose --profile backup run --rm backup
#
# Deja el resultado en backups/trama-AAAAMMDD-HHMMSS.tar.gz.gpg (en la raíz del repo).
set -eu

: "${MYSQL_PASSWORD:?Falta MYSQL_PASSWORD}"
. /scripts/clave.sh

FECHA=$(date -u +%Y%m%d-%H%M%S)
DESTINO="/backups/trama-$FECHA.tar.gz.gpg"

# Carpeta de trabajo temporal: se borra siempre al terminar, aunque algo falle,
# para que no quede ninguna copia sin cifrar.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
chmod 700 "$TMP"

echo "Copiando la base trama..."
MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
    -h mysql -u trama \
    --single-transaction --no-tablespaces --triggers \
    trama > "$TMP/base.sql"

echo "Copiando los archivos adjuntos..."
mkdir -p "$TMP/uploads"
cp -a /uploads/. "$TMP/uploads/"

echo "Cifrando con AES-256..."
mkdir -m 700 "$TMP/gnupg"
printf '%s' "$TRAMA_BACKUP_KEY" > "$TMP/clave"
chmod 600 "$TMP/clave"

tar -czf - -C "$TMP" base.sql uploads \
    | GNUPGHOME="$TMP/gnupg" gpg --batch --yes --quiet \
        --pinentry-mode loopback --passphrase-file "$TMP/clave" \
        --symmetric --cipher-algo AES256 \
        --output "$DESTINO"

ARCHIVOS=$(find "$TMP/uploads" -type f | wc -l)
echo "Backup listo: backups/$(basename "$DESTINO") ($ARCHIVOS archivos adjuntos)"

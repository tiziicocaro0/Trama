#!/bin/sh
# Restaura un backup cifrado de TRAMA (0.3). Corre dentro del servicio "backup":
#
#   docker compose --profile backup run --rm --entrypoint sh backup \
#       /scripts/restaurar.sh trama-AAAAMMDD-HHMMSS.tar.gz.gpg
#
# Por defecto restaura en una base de PRUEBA (trama_restaurada) y deja los archivos en
# backups/restauracion-<backup>/uploads, para revisar sin tocar los datos reales.
# Para pisar la base real y el volumen de archivos hay que pedirlo explícitamente:
#
#   ... /scripts/restaurar.sh trama-AAAAMMDD-HHMMSS.tar.gz.gpg --sobrescribir-real
set -eu

: "${MYSQL_ROOT_PASSWORD:?Falta MYSQL_ROOT_PASSWORD}"
. /scripts/clave.sh

NOMBRE="${1:?Indicá el archivo de backup, por ejemplo trama-20261022-201500.tar.gz.gpg}"
ARCHIVO="/backups/$(basename "$NOMBRE")"
MODO="${2:-prueba}"

[ -f "$ARCHIVO" ] || { echo "No existe $ARCHIVO" >&2; exit 1; }

if [ "$MODO" = "--sobrescribir-real" ]; then
    BASE="trama"
    DESTINO_ARCHIVOS="/uploads"
else
    BASE="trama_restaurada"
    DESTINO_ARCHIVOS="/backups/restauracion-$(basename "$ARCHIVO" .tar.gz.gpg)/uploads"
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
chmod 700 "$TMP"

echo "Descifrando $(basename "$ARCHIVO")..."
mkdir -m 700 "$TMP/gnupg"
printf '%s' "$TRAMA_BACKUP_KEY" > "$TMP/clave"
chmod 600 "$TMP/clave"

if ! GNUPGHOME="$TMP/gnupg" gpg --batch --quiet \
        --pinentry-mode loopback --passphrase-file "$TMP/clave" \
        --output "$TMP/backup.tar.gz" --decrypt "$ARCHIVO" 2>/dev/null; then
    echo "No se pudo descifrar: la clave TRAMA_BACKUP_KEY no coincide o el archivo está dañado." >&2
    exit 1
fi

tar -xzf "$TMP/backup.tar.gz" -C "$TMP"

echo "Restaurando la base en '$BASE'..."
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql -h mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`$BASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -h mysql -u root "$BASE" < "$TMP/base.sql"

echo "Restaurando los archivos adjuntos en $DESTINO_ARCHIVOS..."
mkdir -p "$DESTINO_ARCHIVOS"
cp -a "$TMP/uploads/." "$DESTINO_ARCHIVOS/"

ARCHIVOS=$(find "$TMP/uploads" -type f | wc -l)
echo "Restauración lista: base '$BASE' y $ARCHIVOS archivos adjuntos."

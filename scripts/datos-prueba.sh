#!/bin/sh
# Levanta el back con datos ficticios, solo para desarrollo (macOS / Linux).
#
#   sh scripts/datos-prueba.sh              # usa la base trama_prueba (la crea si no existe)
#   sh scripts/datos-prueba.sh --reiniciar  # la borra y la vuelve a cargar desde cero
#
# Usa la base trama_prueba del MySQL de Docker: la base trama no se toca.
# El código de los datos está en backend/src/test (TramaConDatosDePrueba): no entra en el jar.
# Después levantá el front como siempre (cd frontend && npm run dev).
set -eu

raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$raiz"

reiniciar=0
[ "${1:-}" = "--reiniciar" ] && reiniciar=1

fallar() {
    echo ""
    echo "ERROR: $1"
    exit 1
}

# MYSQL_ROOT_PASSWORD del .env (sin los \r de Windows)
[ -f .env ] || fallar "Falta el .env en la raíz del repo."
MYSQL_ROOT_PASSWORD=$(grep '^MYSQL_ROOT_PASSWORD=' .env | head -n 1 | cut -d= -f2- | tr -d '\r')
[ -n "$MYSQL_ROOT_PASSWORD" ] || fallar "Falta MYSQL_ROOT_PASSWORD en el .env."

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'trama-mysql'; then
    echo "==> MySQL ya está levantado"
else
    echo "==> Levantando MySQL"
    docker compose up -d --wait mysql || fallar "MySQL no arrancó. ¿Está abierto Docker?"
fi

sql="CREATE DATABASE IF NOT EXISTS trama_prueba CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL PRIVILEGES ON trama_prueba.* TO 'trama'@'%';"
if [ "$reiniciar" -eq 1 ]; then
    echo "==> Borrando la base trama_prueba"
    sql="DROP DATABASE IF EXISTS trama_prueba; $sql"
fi
docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" trama-mysql mysql -uroot -e "$sql" \
    || fallar "No se pudo preparar la base trama_prueba."

echo "==> Levantando el back con datos de prueba (Ctrl+C para cortarlo)"
cd backend
./mvnw -q spring-boot:test-run -Dspring-boot.run.main-class=com.trama.datosprueba.TramaConDatosDePrueba

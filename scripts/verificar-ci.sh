#!/bin/sh
# =====================================================================
# TRAMA · Corre en local los mismos pasos que el CI (.github/workflows/ci.yml)
#
# Uso (desde cualquier carpeta del repo):
#   sh scripts/verificar-ci.sh                 # backend + frontend
#   sh scripts/verificar-ci.sh --backend       # solo backend
#   sh scripts/verificar-ci.sh --frontend      # solo frontend
#   sh scripts/verificar-ci.sh --npm-ci        # además reinstala node_modules con npm ci
#
# Lo llama el hook .githooks/pre-push con las opciones que corresponden
# a los cambios que se suben.
#
# Diferencias con correr "./mvnw test" o "npm test" a mano, que es lo que
# hacía que algo pasara en local y fallara en el CI:
#   - Backend: el CI usa una base trama_test VACÍA. Acá se recrea antes de
#     los tests, así Flyway corre todas las migraciones desde cero y
#     Hibernate valida el esquema igual que en el CI.
#   - Frontend: se corren lint (ESLint + check:estilos) y los tests, que
#     antes no se verificaban antes de pushear.
#   - Se buscan marcadores de conflicto (<<<<<<< / >>>>>>>) olvidados.
# =====================================================================

set -eu

cd "$(git rev-parse --show-toplevel)"

correr_backend=0
correr_frontend=0
forzar_npm_ci=0

for opcion in "$@"; do
    case "$opcion" in
        --backend) correr_backend=1 ;;
        --frontend) correr_frontend=1 ;;
        --npm-ci) forzar_npm_ci=1 ;;
        *)
            echo "Opción desconocida: $opcion"
            exit 2
            ;;
    esac
done

# Sin --backend ni --frontend: se corre todo.
if [ "$correr_backend" -eq 0 ] && [ "$correr_frontend" -eq 0 ]; then
    correr_backend=1
    correr_frontend=1
fi

paso() {
    echo ""
    echo "==> $1"
}

fallar() {
    echo ""
    echo "ERROR: $1"
    exit 1
}

# ---------------------------------------------------------------------
# 0. Marcadores de conflicto olvidados después de un merge
# ---------------------------------------------------------------------
paso "Buscando marcadores de conflicto"
if git grep -n -I -E '^(<<<<<<<|>>>>>>>)( |$)' -- backend frontend/src bd .github >/dev/null 2>&1; then
    git grep -n -I -E '^(<<<<<<<|>>>>>>>)( |$)' -- backend frontend/src bd .github
    fallar "Hay marcadores de conflicto sin resolver."
fi
echo "Sin marcadores de conflicto."

# ---------------------------------------------------------------------
# 1. Backend: igual que el job "Backend Tests"
# ---------------------------------------------------------------------
if [ "$correr_backend" -eq 1 ]; then
    paso "Backend"

    # Variables del .env (se ignoran comentarios y líneas vacías, y se quitan los \r de Windows).
    if [ -f .env ]; then
        while IFS= read -r linea || [ -n "$linea" ]; do
            linea=$(printf '%s' "$linea" | tr -d '\r')
            case "$linea" in
                ''|'#'*) continue ;;
                *=*) export "${linea%%=*}=${linea#*=}" ;;
            esac
        done < .env
    fi

    if [ -z "${MYSQL_PASSWORD:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
        fallar "Faltan MYSQL_PASSWORD o JWT_SECRET en .env."
    fi

    # El CI genera una clave nueva en cada corrida: si falta en el .env, se hace lo mismo.
    if [ -z "${TRAMA_CRYPTO_KEY:-}" ]; then
        TRAMA_CRYPTO_KEY=$(openssl rand -base64 32)
        export TRAMA_CRYPTO_KEY
        echo "TRAMA_CRYPTO_KEY no estaba en .env: se generó una temporal."
    fi

    if command -v java >/dev/null 2>&1; then
        version_java=$(java -version 2>&1 | head -n 1)
        case "$version_java" in
            *'"21'*) ;;
            *) echo "AVISO: el CI usa Java 21 y acá hay: $version_java" ;;
        esac
    fi

    # Base de tests vacía, como el servicio MySQL del CI.
    if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
        fallar "Falta MYSQL_ROOT_PASSWORD en .env: se necesita para recrear la base trama_test."
    fi
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'trama-mysql'; then
        fallar "MySQL no está levantado. Corré: docker compose up -d"
    fi
    echo "Recreando la base trama_test vacía..."
    docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" trama-mysql mysql -uroot -e \
        "DROP DATABASE IF EXISTS trama_test; CREATE DATABASE trama_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL PRIVILEGES ON trama_test.* TO 'trama'@'%';" \
        || fallar "No se pudo recrear la base trama_test."

    (
        cd backend
        # clean: descarta clases compiladas por el IDE, que pueden quedar rotas
        ./mvnw -B clean test
    ) || fallar "Los tests del backend fallaron."
    echo "Backend OK."
fi

# ---------------------------------------------------------------------
# 2. Frontend: igual que el job "Frontend Tests"
# ---------------------------------------------------------------------
if [ "$correr_frontend" -eq 1 ]; then
    paso "Frontend"

    version_node=$(node -v 2>/dev/null || echo "sin node")
    case "$version_node" in
        v22.*) ;;
        *) echo "AVISO: el CI usa Node 22 y acá hay: $version_node" ;;
    esac

    (
        cd frontend
        # npm ci falla si package-lock.json no coincide con package.json, igual que en el CI.
        if [ "$forzar_npm_ci" -eq 1 ] || [ ! -d node_modules ]; then
            npm ci
        fi
        npm run lint
        # Pocos workers en paralelo: en Windows, abrir muchos procesos de Node a la
        # vez hace que Vitest corte por "Timeout waiting for worker to respond".
        # Los tests son los mismos que en el CI; solo cambia cuántos corren a la vez.
        # Se puede ajustar con VITEST_MAX_WORKERS (ej. VITEST_MAX_WORKERS=1).
        npm test -- --run --maxWorkers="${VITEST_MAX_WORKERS:-2}"
    ) || fallar "El lint o los tests del frontend fallaron."
    echo "Frontend OK."
fi

echo ""
echo "Todo OK: estos pasos coinciden con los del CI."

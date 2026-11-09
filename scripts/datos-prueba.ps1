# Levanta el back con datos ficticios, solo para desarrollo (Windows).
#
#   .\datos-prueba.cmd              usa la base trama_prueba (la crea si no existe)
#   .\datos-prueba.cmd -Reiniciar   la borra y la vuelve a cargar desde cero
#
# Usa la base trama_prueba del MySQL de Docker: la base trama no se toca.
# El código de los datos está en backend\src\test (TramaConDatosDePrueba): no entra en el jar.
# Después levantá el front como siempre (cd frontend; npm run dev).
param([switch]$Reiniciar)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Test-Path .env)) { throw 'Falta el .env en la raíz del repo.' }
$clave = (Get-Content .env | Where-Object { $_ -match '^MYSQL_ROOT_PASSWORD=' } | Select-Object -First 1) -replace '^MYSQL_ROOT_PASSWORD=', ''
if (-not "$clave".Trim()) { throw 'Falta MYSQL_ROOT_PASSWORD en el .env.' }

$corriendo = docker ps --format '{{.Names}}' 2>$null | Where-Object { $_ -eq 'trama-mysql' }
if ($corriendo) {
    Write-Host '1/2 MySQL ya está levantado.' -ForegroundColor Cyan
} else {
    Write-Host '1/2 Levantando MySQL...' -ForegroundColor Cyan
    docker compose up -d --wait mysql
    if ($LASTEXITCODE -ne 0) { throw 'MySQL no arrancó. ¿Está abierto Docker Desktop?' }
}

$sql = "CREATE DATABASE IF NOT EXISTS trama_prueba CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL PRIVILEGES ON trama_prueba.* TO 'trama'@'%';"
if ($Reiniciar) {
    Write-Host 'Borrando la base trama_prueba...' -ForegroundColor Cyan
    $sql = "DROP DATABASE IF EXISTS trama_prueba; $sql"
}
docker exec -e "MYSQL_PWD=$clave" trama-mysql mysql -uroot -e $sql
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la base trama_prueba.' }

Write-Host '2/2 Levantando el back con datos de prueba (Ctrl+C para cortarlo)...' -ForegroundColor Cyan
Set-Location "$raiz\backend"
.\mvnw.cmd -q spring-boot:test-run "-Dspring-boot.run.main-class=com.trama.datosprueba.TramaConDatosDePrueba"

# Levanta la demo para testers con un solo comando y al final muestra el link.
#
#   .\demo.cmd
#       Todo en Docker: MySQL, back, front y ngrok.
#
#   .\demo.cmd -BackEnWindows
#       El back corre en Windows (mvnw) y el resto en Docker. Sirve si la red
#       no deja salir el mail desde Docker (pasó con el WiFi de la facultad).
#
# Para apagar: docker compose --profile demo stop  (y cerrar la ventana del back si la hay)
param([switch]$BackEnWindows, [switch]$SinAbrir)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

$url = (Get-Content .env | Where-Object { $_ -match '^NGROK_URL=' }) -replace '^NGROK_URL=', ''
$token = (Get-Content .env | Where-Object { $_ -match '^NGROK_AUTHTOKEN=' }) -replace '^NGROK_AUTHTOKEN=', ''
if (-not "$token".Trim()) { throw 'Falta NGROK_AUTHTOKEN en el .env: copialo del panel de ngrok.' }
if (-not "$url".Trim()) { throw 'Falta NGROK_URL en el .env.' }

# Espera a que el back conteste a través del front (un 401 en /api/auth/yo = está vivo).
function Esperar-Back {
    Write-Host 'Esperando a que el back arranque (la primera vez tarda unos minutos)...' -ForegroundColor Cyan
    for ($i = 0; $i -lt 120; $i++) {
        $codigo = & curl.exe -s -o NUL -w '%{http_code}' http://localhost:4173/api/auth/yo
        if ($codigo -eq '401' -or $codigo -eq '200') { return }
        Start-Sleep -Seconds 3
    }
    throw 'El back no respondió en 6 minutos: mirá docker compose logs backend-demo'
}

function Mostrar-Link {
    Write-Host ''
    Write-Host '  TRAMA está lista:' -ForegroundColor Green
    Write-Host "  $url" -ForegroundColor Green
    Write-Host '  (En esta PC también: http://localhost:4173)'
    Write-Host ''
    if (-not $SinAbrir) { Start-Process $url }
}

if (-not $BackEnWindows) {
    # Ignora DEMO_BACKEND_URL del .env: el front apunta al back de Docker.
    $env:DEMO_BACKEND_URL = 'http://backend-demo:8080'
    docker compose --profile demo up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'No arrancó la demo. ¿Está abierto Docker Desktop?' }
    Esperar-Back
    Mostrar-Link
    return
}

Write-Host '1/3 Levantando MySQL...' -ForegroundColor Cyan
docker compose up -d --wait mysql
if ($LASTEXITCODE -ne 0) { throw 'MySQL no arrancó. ¿Está abierto Docker Desktop?' }

Write-Host '2/3 Abriendo el back en otra ventana...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$raiz\backend'; .\mvnw.cmd spring-boot:run"

$listo = $false
for ($i = 0; $i -lt 90; $i++) {
    try {
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:4002/actuator/health | Out-Null
        $listo = $true
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
if (-not $listo) { throw 'El back no respondió en 3 minutos: revisá su ventana.' }

Write-Host '3/3 Levantando el front y ngrok...' -ForegroundColor Cyan
$env:DEMO_BACKEND_URL = 'http://host.docker.internal:4002'
docker compose --profile demo up -d --build frontend-demo ngrok
if ($LASTEXITCODE -ne 0) { throw 'No arrancaron el front o ngrok: docker compose logs frontend-demo ngrok' }

Esperar-Back
Mostrar-Link

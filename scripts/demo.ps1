# Levanta la demo para testers con un solo comando.
#
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1
#       Back en Windows (mvnw), MySQL + front + ngrok en Docker.
#       Es el modo que hay que usar si el mail no sale desde Docker.
#
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1 -TodoEnDocker
#       Todo en Docker, incluido el back.
#
# Para apagar: docker compose --profile demo stop  (y cerrar la ventana del back)
param([switch]$TodoEnDocker)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

$url = (Get-Content .env | Where-Object { $_ -match '^NGROK_URL=' }) -replace '^NGROK_URL=', ''
$token = (Get-Content .env | Where-Object { $_ -match '^NGROK_AUTHTOKEN=' }) -replace '^NGROK_AUTHTOKEN=', ''
if (-not "$token".Trim()) { throw 'Falta NGROK_AUTHTOKEN en el .env: copialo del panel de ngrok.' }
if (-not "$url".Trim()) { throw 'Falta NGROK_URL en el .env.' }

if ($TodoEnDocker) {
    # Ignora DEMO_BACKEND_URL del .env: el front apunta al back de Docker.
    $env:DEMO_BACKEND_URL = 'http://backend-demo:8080'
    docker compose --profile demo up -d --build
    Write-Host "Listo. TRAMA en $url (el back tarda unos segundos en arrancar)." -ForegroundColor Green
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
docker compose --profile demo up -d --build frontend-demo ngrok
if ($LASTEXITCODE -ne 0) { throw 'No arrancaron el front o ngrok: docker compose logs frontend-demo ngrok' }

Write-Host "Listo. TRAMA en $url" -ForegroundColor Green

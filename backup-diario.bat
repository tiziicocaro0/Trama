@echo off
cd /d "%~dp0"

if not exist "backups" mkdir "backups"

docker compose --profile backup run --rm backup >> "backups\backup-diario.log" 2>&1

if errorlevel 1 (
    echo [%date% %time%] ERROR: Fallo el backup >> "backups\backup-diario.log"
    exit /b 1
)

echo [%date% %time%] OK: Backup completado >> "backups\backup-diario.log"

REM Retencion de 30 dias - modo de prueba
REM Mostrar los archivos antiguos sin eliminarlos
forfiles /P "%~dp0backups" /M "trama-*.tar.gz.gpg" /D -30 /C "cmd /c echo @file" >> "backups\backup-diario.log" 2>nul
exit /b 0
@echo off
rem Levanta el back con datos ficticios, solo para desarrollo. Opcion: -Reiniciar
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\datos-prueba.ps1" %*

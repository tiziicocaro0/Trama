@echo off
rem Levanta la demo para testers y muestra el link. Opciones: -BackEnWindows -SinAbrir
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\demo.ps1" %*

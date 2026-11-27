@echo off
title COFFEE VALUE BRIDGE - Lanzador
echo ============================================================
echo   Iniciando COFFEE VALUE BRIDGE (Backend + Python + Web)
echo ============================================================

set "ROOT=%~dp0"
set "JAVA_EXE=C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot\bin\java.exe"

echo [1/3] Iniciando Backend Spring Boot en http://localhost:8080 ...
start "CVB Backend (8080)" /D "%ROOT%backend" "%JAVA_EXE%" -jar "%ROOT%backend\target\coffee-value-bridge-1.0.0.jar" --server.port=8080 --spring.profiles.active=local

echo [2/3] Iniciando Microservicio Python GIS/ML en http://localhost:8001 ...
start "CVB Python Analytics (8001)" /D "%ROOT%analytics" python -m app.main

echo [3/3] Iniciando Frontend Web en http://localhost:5173 ...
start "CVB Frontend (5173)" /D "%ROOT%frontend" cmd /k npm run dev

echo.
echo Esperando 12 segundos a que inicien los servicios...
timeout /t 12 /nobreak > nul

echo Abriendo navegador en http://localhost:5173 ...
start "" http://localhost:5173

echo.
echo Listo! Puede minimizar estas ventanas mientras usa la plataforma.
echo Para cerrarla, cierre las 3 ventanas negras que se abrieron.
pause

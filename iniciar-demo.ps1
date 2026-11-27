# Levanta CoffeBite: backend Spring Boot (8080), frontend (5173) y, si se pide, analytics Python (8001).
# Uso:  .\iniciar-demo.ps1            (backend + frontend)
#       .\iniciar-demo.ps1 -ConAnalytics
#       .\iniciar-demo.ps1 -SoloFrontend   (modo demo con datos locales, sin Java)
param([switch]$ConAnalytics, [switch]$SoloFrontend, [switch]$Recompilar)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot

function Esperar-Servicio($url, $nombre, $segundos) {
  for ($i = 0; $i -lt $segundos; $i++) {
    try { Invoke-RestMethod $url -TimeoutSec 2 | Out-Null; Write-Host "  $nombre listo" -ForegroundColor Green; return $true } catch { Start-Sleep 1 }
  }
  Write-Host "  $nombre no respondió en $segundos s (la app sigue en modo demo)" -ForegroundColor Yellow
  return $false
}

if (-not $SoloFrontend) {
  if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'No se encontró java en el PATH (se necesita Java 21).' }
  $jar = Join-Path $raiz 'backend\target\coffee-value-bridge-1.0.0.jar'
  if ($Recompilar -or -not (Test-Path $jar)) {
    if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) { throw 'No se encontró mvn en el PATH para compilar el backend.' }
    Write-Host '[1/3] Compilando backend (la primera vez tarda)...'
    Push-Location (Join-Path $raiz 'backend'); try { mvn -q -DskipTests package } finally { Pop-Location }
  }
  # ponytail: clave JWT aleatoria por sesión; los tokens no sobreviven a un reinicio, suficiente para la demo
  $env:JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  Write-Host '[1/3] Backend en http://localhost:8080'
  Start-Process java -ArgumentList '-Xmx512m', '-jar', "`"$jar`"", '--spring.profiles.active=local' -WorkingDirectory (Join-Path $raiz 'backend') -WindowStyle Minimized
}

if ($ConAnalytics) {
  $venv = Join-Path $raiz 'analytics\.venv'
  if (-not (Test-Path $venv)) {
    Write-Host '[2/3] Instalando analytics (una sola vez)...'
    python -m venv $venv
    & "$venv\Scripts\pip.exe" install -q -r (Join-Path $raiz 'analytics\requirements.txt')
  }
  Write-Host '[2/3] Analytics en http://localhost:8001'
  Start-Process "$venv\Scripts\python.exe" -ArgumentList '-m', 'app.main' -WorkingDirectory (Join-Path $raiz 'analytics') -WindowStyle Minimized
}

$front = Join-Path $raiz 'frontend'
if (-not (Test-Path (Join-Path $front 'node_modules'))) { Write-Host '[3/3] Instalando frontend...'; Push-Location $front; try { npm install --silent } finally { Pop-Location } }
Write-Host '[3/3] Frontend en http://localhost:5173'
Start-Process npm.cmd -ArgumentList 'run', 'dev', '--', '--port', '5173', '--strictPort' -WorkingDirectory $front -WindowStyle Minimized

if (-not $SoloFrontend) { Esperar-Servicio 'http://localhost:8080/api/v1/health' 'Backend' 120 | Out-Null }
if ($ConAnalytics) { Esperar-Servicio 'http://localhost:8001/health' 'Analytics' 60 | Out-Null }
Esperar-Servicio 'http://localhost:5173' 'Frontend' 60 | Out-Null
Start-Process 'http://localhost:5173'
Write-Host 'Listo. Para cerrar todo: .\detener-demo.ps1'

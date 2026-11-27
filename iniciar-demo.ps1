# Levanta las dos piezas fusionadas: backend Spring Boot (8080) y frontend CaféTrace (5173).
# Opcionalmente analytics Python (8001). Sin Ollama: el copiloto usa el motor de reglas del backend.
# Uso:  .\iniciar-demo.ps1
#       .\iniciar-demo.ps1 -ConAnalytics
#       .\iniciar-demo.ps1 -SoloFrontend   (demo con datos locales, sin Java)
param([switch]$ConAnalytics, [switch]$SoloFrontend, [switch]$Recompilar)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot

function Test-Url([string]$url) {
  try { Invoke-RestMethod $url -TimeoutSec 3 | Out-Null; return $true } catch { return $false }
}

function Esperar-Servicio($url, $nombre, $segundos) {
  for ($i = 0; $i -lt $segundos; $i++) {
    if (Test-Url $url) { Write-Host "  $nombre listo" -ForegroundColor Green; return $true }
    Start-Sleep 1
  }
  Write-Host "  $nombre no respondió en $segundos s (la app sigue en modo demo)" -ForegroundColor Yellow
  return $false
}

$estado = @()

if (-not $SoloFrontend) {
  # En este PC el PATH trae Java 8; preferimos el Temurin 21 instalado.
  $jdk21 = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'jdk-21*' } | Select-Object -First 1
  if ($jdk21) {
    $env:JAVA_HOME = $jdk21.FullName
    $env:PATH = "$($jdk21.FullName)\bin;$env:PATH"
  }
  $javaExe = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else { 'java' }

  $mvnExe = (Get-Command mvn -ErrorAction SilentlyContinue).Source
  if (-not $mvnExe) {
    $mvnPortable = Join-Path $env:TEMP 'opencode\tools\maven\bin\mvn.cmd'
    if (Test-Path $mvnPortable) { $mvnExe = $mvnPortable }
    else { throw 'No se encontró mvn. Instala Maven 3.9 o pon mvn.cmd en el PATH.' }
  }

  $jar = Join-Path $raiz 'backend\target\coffee-value-bridge-1.0.0.jar'
  if ($Recompilar -or -not (Test-Path $jar)) {
    Write-Host '[1/3] Compilando backend (la primera vez tarda)...'
    Push-Location (Join-Path $raiz 'backend')
    try { & $mvnExe -q -DskipTests package } finally { Pop-Location }
  }
  # Clave JWT aleatoria por sesión; los tokens no sobreviven a un reinicio.
  $env:JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  Write-Host '[1/3] Backend en http://localhost:8080'
  if (-not (Test-Url 'http://localhost:8080/api/v1/health')) {
    Start-Process -FilePath $javaExe -ArgumentList '-Xmx512m', '-jar', "`"$jar`"", '--spring.profiles.active=local' -WorkingDirectory (Join-Path $raiz 'backend') -WindowStyle Minimized
  }
  $estado += 'Backend  http://localhost:8080/api/v1/health ' + $(if (Esperar-Servicio 'http://localhost:8080/api/v1/health' 'Backend' 120) { 'OK' } else { 'NO' })
}

if ($ConAnalytics) {
  $venv = Join-Path $raiz 'analytics\.venv'
  if (-not (Test-Path $venv)) {
    Write-Host '[2/3] Instalando analytics (una sola vez)...'
    python -m venv $venv
    & "$venv\Scripts\pip.exe" install -q -r (Join-Path $raiz 'analytics\requirements.txt')
  }
  Write-Host '[2/3] Analytics en http://localhost:8001'
  if (-not (Test-Url 'http://localhost:8001/health')) {
    Start-Process "$venv\Scripts\python.exe" -ArgumentList '-m', 'app.main' -WorkingDirectory (Join-Path $raiz 'analytics') -WindowStyle Minimized
  }
  $estado += 'Analytics http://localhost:8001/health ' + $(if (Esperar-Servicio 'http://localhost:8001/health' 'Analytics' 60) { 'OK' } else { 'NO' })
}

$front = Join-Path $raiz 'frontend'
if (-not (Test-Path (Join-Path $front 'node_modules'))) {
  Write-Host '[3/3] Instalando frontend...'
  Push-Location $front
  try { npm install --silent } finally { Pop-Location }
}
Write-Host '[3/3] Frontend en http://localhost:5173'
if (-not (Test-Url 'http://localhost:5173')) {
  Start-Process npm.cmd -ArgumentList 'run', 'dev', '--', '--port', '5173', '--strictPort' -WorkingDirectory $front -WindowStyle Minimized
}
$estado += 'Frontend http://localhost:5173 ' + $(if (Esperar-Servicio 'http://localhost:5173' 'Frontend' 60) { 'OK' } else { 'NO' })

Write-Host ''
Write-Host '=== Estado de la demo ===' -ForegroundColor Cyan
$estado | ForEach-Object { Write-Host "  $_" }
Start-Process 'http://localhost:5173'
Write-Host 'Listo. Para cerrar todo: .\detener-demo.ps1'

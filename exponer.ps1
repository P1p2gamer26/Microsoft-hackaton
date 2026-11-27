# Expone a internet lo que corre en este PC con un túnel gratis de Cloudflare (sin cuenta).
#
#   .\exponer.ps1 -App      App completa (frontend + backend vía proxy de Vite) con un link público.
#                           Arranca la demo si no está corriendo.
#   .\exponer.ps1 -Ollama   Expone Ollama local para que el agente desplegado en Render use IA real.
#                           Con $env:RENDER_API_KEY actualiza OLLAMA_HOST del servicio y lo redespliega.
#
# El link vive mientras esta ventana siga abierta. Ctrl+C lo cierra.
# Ojo: quien tenga el link usa tu app / tu Ollama. Compártelo solo con el jurado y ciérralo al terminar.
param(
  [switch]$App,
  [switch]$Ollama,
  [string]$ServicioAgente = 'cvb-hackaton-agente',
  [string]$Modelo = 'qwen2.5:3b'
)
$ErrorActionPreference = 'Stop'
if (-not ($App -or $Ollama)) { Write-Host 'Uso: .\exponer.ps1 -App   o   .\exponer.ps1 -Ollama'; exit 1 }

function Probar($url) { try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; $true } catch { $false } }

# 1. cloudflared
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host 'Instalando cloudflared (una sola vez)...'
  winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements | Out-Null
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { throw 'No se pudo instalar cloudflared. Instálalo con: winget install Cloudflare.cloudflared' }
}

# 2. Servicio local a exponer
if ($App) {
  $puerto = 5173
  if (-not (Probar "http://localhost:$puerto")) {
    Write-Host 'La demo no está corriendo; la arranco...'
    & (Join-Path $PSScriptRoot 'iniciar-demo.ps1')
  }
  $extra = @()
} else {
  $puerto = 11434
  if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { throw 'Falta Ollama: winget install Ollama.Ollama' }
  if (-not (Probar "http://localhost:$puerto/api/tags")) {
    Write-Host 'Arrancando Ollama...'
    Start-Process ollama -ArgumentList 'serve' -WindowStyle Minimized
    for ($i = 0; $i -lt 30 -and -not (Probar "http://localhost:$puerto/api/tags"); $i++) { Start-Sleep 1 }
  }
  $modelos = (Invoke-RestMethod "http://localhost:$puerto/api/tags").models.name
  if ($modelos -notcontains $Modelo -and $modelos -notcontains "$Modelo`:latest") { Write-Host "Descargando $Modelo..."; ollama pull $Modelo }
  # Ollama solo acepta su propio Host; el túnel lo reescribe
  $extra = @('--http-host-header', "localhost:$puerto")
}

# 3. Túnel: se lee la URL pública de la salida de cloudflared
$log = Join-Path $env:TEMP "cafetrace-tunel-$puerto.log"
Remove-Item $log -ErrorAction SilentlyContinue
$tunel = Start-Process cloudflared -ArgumentList (@('tunnel', '--no-autoupdate', '--url', "http://localhost:$puerto") + $extra) -RedirectStandardError $log -PassThru -WindowStyle Hidden
$url = $null
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
  Start-Sleep 1
  if (Test-Path $log) { $url = (Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1).Matches.Value }
}
if (-not $url) { Stop-Process -Id $tunel.Id -Force -ErrorAction SilentlyContinue; throw "No salió la URL del túnel. Revisa $log" }

Write-Host ''
Write-Host "  Link público: $url" -ForegroundColor Green
Set-Clipboard -Value $url
Write-Host '  (copiado al portapapeles)'

# 4. Con -Ollama: apuntar el agente de Render a este túnel
if ($Ollama) {
  if ($env:RENDER_API_KEY) {
    $h = @{ Authorization = "Bearer $env:RENDER_API_KEY"; Accept = 'application/json' }
    $servicio = (Invoke-RestMethod "https://api.render.com/v1/services?name=$ServicioAgente&limit=1" -Headers $h)[0].service
    if (-not $servicio) { Write-Host "No encontré el servicio $ServicioAgente en Render." -ForegroundColor Yellow }
    else {
      Invoke-RestMethod "https://api.render.com/v1/services/$($servicio.id)/env-vars/OLLAMA_HOST" -Method Put -Headers $h -ContentType 'application/json' -Body (@{ value = $url } | ConvertTo-Json) | Out-Null
      Invoke-RestMethod "https://api.render.com/v1/services/$($servicio.id)/deploys" -Method Post -Headers $h -ContentType 'application/json' -Body '{}' | Out-Null
      Write-Host "  Render: OLLAMA_HOST de $ServicioAgente = $url (redesplegando, ~2 min)" -ForegroundColor Green
    }
  } else {
    Write-Host "  En Render: servicio $ServicioAgente > Environment > OLLAMA_HOST = $url > Save (redespliega solo)." -ForegroundColor Yellow
  }
  Write-Host '  Cada vez que reinicies este script la URL cambia y hay que actualizar OLLAMA_HOST.'
}

Write-Host ''
Write-Host 'Túnel abierto. Ctrl+C para cerrarlo.'
try { Wait-Process -Id $tunel.Id } finally { Stop-Process -Id $tunel.Id -Force -ErrorAction SilentlyContinue }

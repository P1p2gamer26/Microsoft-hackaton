# Levanta Ollama (si hace falta), el agente local y abre el prototipo web.
$ErrorActionPreference = "Stop"

$root       = Split-Path -Parent $PSScriptRoot
$model      = if ($env:CVB_MODEL) { $env:CVB_MODEL } else { "qwen2.5:3b-instruct" }
$ollamaHost = if ($env:OLLAMA_HOST) { $env:OLLAMA_HOST } else { "http://127.0.0.1:11434" }
$port       = if ($env:CVB_PORT) { $env:CVB_PORT } else { "8000" }

function Test-Url([string]$url) {
    try { Invoke-RestMethod -Uri $url -TimeoutSec 3 | Out-Null; return $true }
    catch { return $false }
}

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    throw "Ollama no está instalado. Instálalo desde https://ollama.com/download y vuelve a intentar."
}

if (-not (Test-Url "$ollamaHost/api/tags")) {
    Write-Host "Iniciando servicio de Ollama..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Url "$ollamaHost/api/tags") { break }
    }
    if (-not (Test-Url "$ollamaHost/api/tags")) {
        throw "Ollama no respondió en $ollamaHost. Revisa el icono de Ollama en la bandeja."
    }
}

$installed = (& ollama list 2>$null | Out-String)
if ($installed -notmatch [regex]::Escape($model)) {
    Write-Host "Descargando modelo '$model' (puede tardar varios minutos)..."
    & ollama pull $model
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar el modelo '$model'." }
}

$env:CVB_MODEL   = $model
$env:CVB_PORT    = $port
$env:OLLAMA_HOST = $ollamaHost

$healthUrl = "http://127.0.0.1:$port/api/health"
if (Test-Url $healthUrl) {
    Write-Host "El agente ya estaba corriendo en $healthUrl"
} else {
    Write-Host "Arrancando agente en http://127.0.0.1:$port ..."
    Start-Process -FilePath "python" -ArgumentList "`"$PSScriptRoot\server.py`"" `
        -WorkingDirectory $PSScriptRoot -WindowStyle Normal
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Url $healthUrl) { break }
    }
    if (-not (Test-Url $healthUrl)) { throw "El agente no arrancó. Revisa la ventana de python." }
}

Start-Process -FilePath "$root\coffee-value-bridge.html"
Write-Host "Listo. En la web abre 'Coffee Intelligence Copilot' (modo IA local · Ollama)."
Write-Host "Para detener el agente: cierra la ventana de python o presiona Ctrl+C en ella."

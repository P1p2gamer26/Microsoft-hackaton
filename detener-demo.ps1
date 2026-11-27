# Cierra lo que levantó iniciar-demo.ps1 buscando quién escucha en cada puerto.
foreach ($puerto in 8080, 8001, 5173) {
  $procesos = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($id in $procesos) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue; Write-Host "Puerto $puerto cerrado (proceso $id)" }
}

# Agente local Coffee Value Bridge (Ollama)

Agente de IA que corre **en tu PC**, sin APIs de pago. Consulta `Propuesta.md` y `docs/*.md`, puede hacer cÃ¡lculos de exportaciÃ³n y responde dentro del prototipo `coffee-value-bridge.html`.

## Requisitos

- Windows con Ollama instalado: https://ollama.com/download
- Python 3.10+ (verificado con 3.14.6). No hay dependencias pip obligatorias.

## Arranque en un paso

Desde la raÃ­z del repo, en PowerShell:

```powershell
.\agent\start.ps1
```

El script: inicia Ollama si no estÃ¡ activo, descarga `qwen3` si falta, levanta el servidor en `http://127.0.0.1:8000` y abre el HTML.

En la web, entra a **Coffee Intelligence Copilot**. Por defecto usa **IA local Â· Ollama**; el botÃ³n *Cambiar a reglas DEMO* permite volver al motor original sin modelo.

## VerificaciÃ³n manual

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/sources
Invoke-RestMethod http://127.0.0.1:8000/api/chat -Method Post -ContentType "application/json" -Body '{"message":"Â¿CuÃ¡les son los 5 mÃ³dulos de la plataforma?"}'
```

## Preguntas de prueba

1. Â¿QuÃ© problema resuelve Coffee Value Bridge y para quiÃ©n?
2. Â¿CuÃ¡les son los cinco componentes de la plataforma?
3. Â¿QuÃ© barreras comerciales o logÃ­sticas menciona la propuesta?
4. Compara exportar 1000 kg de cafÃ© verde vs tostado: verde a 4.8 USD/kg, tostado a 11 USD/kg, costo verde 3.5 USD/kg, tostiÃ³n 1.2 USD/kg, merma 15%.
5. Â¿DÃ³nde estÃ¡ el cuello de botella en el ciclo de comercializaciÃ³n?

## ConfiguraciÃ³n (variables de entorno)

| Variable | Default | DescripciÃ³n |
|---|---|---|
| `CVB_MODEL` | `qwen3` | Modelo de Ollama a usar |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | DirecciÃ³n del servicio Ollama |
| `CVB_PORT` | `8000` | Puerto del agente (tiene prioridad sobre `PORT`) |
| `PORT` | â€” | Puerto que inyecta Render cuando no hay `CVB_PORT` |
| `CVB_HOST` | `127.0.0.1` | Interface de escucha; en Render se usa `0.0.0.0` |
| `CVB_OLLAMA_TIMEOUT` | `180` | Segundos de espera por respuesta |
| `CVB_OLLAMA_THINK` | `0` | Activa el modo "thinking" de Qwen3 (`1`/`true`); por defecto desactivado para respuestas limpias y tool-calling confiable |
| `CVB_ROOT` | raÃ­z del repo | DÃ³nde buscar documentos |

## CÃ³mo funciona

1. El servidor indiza los `.md` del repo por palabras clave (sin base vectorial).
2. El modelo recibe el prompt de `prompts/system.md` y cuatro herramientas: buscar documentos, listar mÃ³dulos, listar documentos y comparar escenarios verde/tostado.
3. Si el modelo pide una herramienta, el servidor la ejecuta y le devuelve el resultado para que redacte la respuesta final con citas.
4. Si el modelo no soporta tool-calling, se inyecta contexto de los documentos directamente (modo `context`).
5. Si Ollama no estÃ¡ disponible (deploy en Render), responde con fragmentos indexados y citas (modo `offline`).

## Cambiar de modelo

```powershell
ollama pull llama3.1:8b
$env:CVB_MODEL = "llama3.1:8b"
.\agent\start.ps1
```

Nota: por defecto escucha solo en `127.0.0.1`. En Render se configura `CVB_HOST=0.0.0.0` y el puerto lo asigna la plataforma. El endpoint pÃºblico `/api/chat` no requiere autenticaciÃ³n; Ãºsalo solo para demo.


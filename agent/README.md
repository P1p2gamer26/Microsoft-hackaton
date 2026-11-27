# Agente local Coffee Value Bridge (Ollama)

Agente de IA que corre **en tu PC**, sin APIs de pago. Consulta `Propuesta.md` y `docs/*.md`, puede hacer cálculos de exportación y responde dentro del prototipo `coffee-value-bridge.html`.

## Requisitos

- Windows con Ollama instalado: https://ollama.com/download
- Python 3.10+ (verificado con 3.14.6). No hay dependencias pip obligatorias.

## Arranque en un paso

Desde la raíz del repo, en PowerShell:

```powershell
.\agent\start.ps1
```

El script: inicia Ollama si no está activo, descarga `qwen2.5:3b-instruct` si falta, levanta el servidor en `http://127.0.0.1:8000` y abre el HTML.

En la web, entra a **Coffee Intelligence Copilot**. Por defecto usa **IA local · Ollama**; el botón *Cambiar a reglas DEMO* permite volver al motor original sin modelo.

## Verificación manual

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/sources
Invoke-RestMethod http://127.0.0.1:8000/api/chat -Method Post -ContentType "application/json" -Body '{"message":"¿Cuáles son los 5 módulos de la plataforma?"}'
```

## Preguntas de prueba

1. ¿Qué problema resuelve Coffee Value Bridge y para quién?
2. ¿Cuáles son los cinco componentes de la plataforma?
3. ¿Qué barreras comerciales o logísticas menciona la propuesta?
4. Compara exportar 1000 kg de café verde vs tostado: verde a 4.8 USD/kg, tostado a 11 USD/kg, costo verde 3.5 USD/kg, tostión 1.2 USD/kg, merma 15%.
5. ¿Dónde está el cuello de botella en el ciclo de comercialización?

## Configuración (variables de entorno)

| Variable | Default | Descripción |
|---|---|---|
| `CVB_MODEL` | `qwen2.5:3b-instruct` | Modelo de Ollama a usar |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Dirección del servicio Ollama |
| `CVB_PORT` | `8000` | Puerto del agente |
| `CVB_OLLAMA_TIMEOUT` | `180` | Segundos de espera por respuesta |
| `CVB_ROOT` | raíz del repo | Dónde buscar documentos |

## Cómo funciona

1. El servidor indiza los `.md` del repo por palabras clave (sin base vectorial).
2. El modelo recibe el prompt de `prompts/system.md` y cuatro herramientas: buscar documentos, listar módulos, listar documentos y comparar escenarios verde/tostado.
3. Si el modelo pide una herramienta, el servidor la ejecuta y le devuelve el resultado para que redacte la respuesta final con citas.
4. Si el modelo no soporta tool-calling, se inyecta contexto de los documentos directamente (modo `context`).

## Cambiar de modelo

```powershell
ollama pull llama3.1:8b
$env:CVB_MODEL = "llama3.1:8b"
.\agent\start.ps1
```

Nota: el servidor escucha solo en `127.0.0.1`. No exponer a Internet sin autenticación.

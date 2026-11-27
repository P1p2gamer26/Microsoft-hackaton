# Ollama + Qwen3 en Coffee Value Bridge

Qwen3 corre **local, sin APIs de pago ni internet** vía [Ollama](https://ollama.com/download). Se usa en dos lugares:

## 1) Agente local (Coffee Intelligence Copilot) — `agent/`

```powershell
ollama pull qwen3            # Qwen3 8B (por defecto). En CPU ligera: ollama pull qwen3:4b + CVB_MODEL=qwen3:4b
.\agent\start.ps1            # inicia Ollama si hace falta, descarga el modelo, levanta http://127.0.0.1:8000
```

- Variables: `CVB_MODEL=qwen3`, `OLLAMA_HOST=http://127.0.0.1:11434`, `CVB_OLLAMA_TIMEOUT=180`, `CVB_OLLAMA_THINK=0`.
- `CVB_OLLAMA_THINK=1` activa el modo "thinking" de Qwen3; por defecto **desactivado** para respuestas limpias y tool-calling confiable. El razonamiento interno (`message.thinking`) nunca se expone, y cualquier `<think>...</think>` se elimina.
- Tool-calling nativo de Ollama; respaldo automático `<tool_call>`; `name` en los mensajes `tool`.
- Verificación: `Invoke-RestMethod http://127.0.0.1:8000/api/health` -> `"model":"qwen3","model_installed":true`.
- Sin Ollama: responde en modo `offline` con documentos indexados; con `CVB_MODEL` apuntando a otro modelo (`llama3.1:8b`, `qwen3:4b`...) sigue funcionando.

## 2) Export Copilot (Spring Boot `/api/v1/copilot/analyze`) — `backend/`

Motor **experto local siempre activo** (requisitos FDA/EUDR/DIAN, documentos, alertas, citas oficiales, descargo legal). Capa **LLM opcional** que solo *redacta* `copilotAnswer`, anclada a los DATOS del motor; nunca inventa cifras/fuentes y si falla cae al motor experto.

```powershell
ollama pull qwen3
# variables de entorno del backend:
LLM_ENABLED=true
LLM_API_URL=http://127.0.0.1:11434   # Ollama nativo -> POST /api/chat ; termina en /v1 -> OpenAI-compatible /chat/completions
LLM_MODEL=qwen3
LLM_API_KEY=                          # no necesario para Ollama local
```

Respuesta añade: `"engine": "llm+expert:qwen3" | "expert-local"`, `"llm": {configured, used, model}` y `"copilotAnswer"` (cuando `used=true`).

> Nota de rendimiento: Qwen3 8B en CPU puro es lento (~2-3 tok/s). En equipos sin GPU usa `LLM_MODEL=qwen3:4b`, reduce `num_predict`, o deja `LLM_ENABLED=false`. La demo nunca se rompe: siempre cae al motor experto. `iniciar-demo.ps1` fuerza `LLM_ENABLED=false`; para probar el LLM, arranca el backend aparte con las variables anteriores.

## Ollama en la nube / Render

Ollama no corre en el plan free de Render; el agente `agent/` cae a modo `offline` con citas y Export Copilot usa el motor experto. `OLLAMA_HOST`/`LLM_API_URL` apuntan a tu Ollama local.

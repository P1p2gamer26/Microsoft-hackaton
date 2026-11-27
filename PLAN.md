# Plan — Coffee Value Bridge: agente de IA local con Ollama + GitHub

> Estado: **plan propuesto, aún sin ejecutar**. Objetivo: dejar funcionando en esta PC un agente IA local (sin APIs de pago) que conozca el proyecto *Coffee Value Bridge*, integrarlo con el prototipo web y publicar el avance en GitHub.

## 0. Contexto verificado

| Item | Estado encontrado |
|---|---|
| Repo Git | `C:\Users\SHERM\Downloads\Microsoft-hackaton`, rama `main`, sin cambios pendientes |
| Remote | `origin → https://github.com/P1p2gamer26/Microsoft-hackaton.git` |
| Contenido | `Propuesta.md`, `coffee-value-bridge.html` (prototipo estático, ~63 KB), `docs/` (análisis, contexts y PDF de ASOEXPORT) |
| Python | 3.14.6 instalado |
| Ollama | **No instalado** |
| GitHub CLI / Docker | **No instalados** |
| Hardware | ~16 GB RAM, sin GPU detectada → modelo pequeño en CPU |

## 1. GitHub (primero, para no perder el trabajo)

1. Verificar autenticación: `git ls-remote origin` (o instalar GitHub CLI si hace falta).
2. Crear rama de trabajo: `git switch -c feature/agente-local-ollama` (nunca commits directos en `main`).
3. Añadir `.gitignore` (`.venv/`, `__pycache__/`, `*.log`, `.env`, modelos/caches locales).
4. Commits pequeños por fase: plan → agente → integración web → documentación.
5. `git push -u origin feature/agente-local-ollama` y abrir Pull Request (si el repo lo permite).
6. No subir credenciales, tokens ni datos confidenciales de ASOEXPORT.

## 2. Instalar Ollama

1. Descargar instalador Windows desde `https://ollama.com/download` y ejecutarlo.
2. Verificar: `ollama --version` y `Invoke-RestMethod http://127.0.0.1:11434/api/tags`.
3. Descargar modelo recomendado para CPU: `ollama pull qwen2.5:3b-instruct` (~2 GB).
   - Alternativa: `llama3.2:3b` (similar) o `llama3.1:8b` (~4.7 GB, más calidad pero más lento).
4. Prueba rápida: `ollama run qwen2.5:3b-instruct "Explica en una frase Coffee Value Bridge"`.
5. Si el puerto 11434 está ocupado o el servicio no arranca, revisar el tray icon de Ollama y reiniciar.

## 3. Construir el agente local

Estructura propuesta (dentro del repo):

```
agent/
  server.py          # servidor HTTP local: /api/health, /api/chat, /api/sources
  ollama_client.py   # comunicación con http://127.0.0.1:11434/api/chat
  tools.py           # herramientas que el agente puede usar
  knowledge.py       # índice simple de Propuesta.md + docs/*.md
  prompts/system.md  # rol, reglas y formato de respuesta
  start.ps1          # arranque en un solo comando
  README.md          # instrucciones de uso
requirements.txt     # solo si se decide usar FastAPI
```

Comportamiento del agente:

- **Rol:** analista de inteligencia comercial para exportación de café tostado colombiano.
- **Conocimiento:** `Propuesta.md`, `docs/*.md` y secciones del HTML, con citas de la fuente en cada respuesta.
- **Reglas:** responder siempre en español, no inventar cifras, decir "no tengo ese dato" cuando no esté en los documentos.
- **Herramientas (MVP):** buscar en documentos, listar módulos de la plataforma, comparar café verde vs tostado con datos que el usuario proporcione, resumir barreras comerciales/logísticas.
- **Arquitectura:** Python estándar (`http.server` + `urllib`) para evitar problemas de compatibilidad con Python 3.14; FastAPI queda como opcional.
- **Tool-calling:** intentar con la API de Ollama; si el modelo pequeño falla, usar fallback de "contexto inyectado" (RAG simple por palabras clave).

## 4. Integración con el prototipo web

1. Añadir un panel "Asistente CVB" en `coffee-value-bridge.html` (input + historial de mensajes).
2. `fetch('http://127.0.0.1:8000/api/chat', { method: 'POST', ... })` con CORS habilitado solo para localhost.
3. Mostrar la respuesta + las fuentes consultadas; mensaje amable si el agente no está corriendo.
4. Probar en el navegador que el panel responde sin recargar la página.

## 5. Deploy local y verificación

1. `agent/start.ps1`: levanta/verifica Ollama, arranca el servidor en `http://127.0.0.1:8000` y abre el HTML.
2. Comprobaciones:
   - `Invoke-RestMethod http://127.0.0.1:8000/api/health` → `ok`.
   - `Invoke-RestMethod http://127.0.0.1:8000/api/chat -Method Post -Body ...` → respuesta con fuentes.
   - Panel del HTML funcionando en el navegador.
3. (Opcional, fase posterior) Empaquetar con Docker Desktop para que el arranque sea reproducible en otra PC.

## 6. "Ver cómo funciona" — prueba de aceptación

Hacer estas 5 preguntas al agente y revisar latencia, precisión y citas:

1. ¿Qué problema resuelve Coffee Value Bridge y para quién?
2. ¿Cuáles son los 5 componentes de la plataforma?
3. ¿Qué mercados deberíamos priorizar según la propuesta?
4. Simula la rentabilidad de exportar café tostado vs café verde con estos datos: ___.
5. ¿Qué barreras logísticas y regulatorias menciona el documento?

Criterio de éxito: respuestas en español, basadas en los archivos del repo, con fuente citada y sin inventar datos.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Python 3.14 muy reciente, librerías sin wheel | Empezar con librería estándar; instalar dependencias solo si son necesarias |
| Sin GPU, respuestas lentas | Modelo 3B; streams de respuesta y timeout configurable |
| Tool-calling inestable en modelos pequeños | Fallback a RAG simple con contexto inyectado |
| Descarga del modelo ~2 GB | Verificar espacio libre antes de `ollama pull` |
| Repo público | `.gitignore` + revisión de archivos antes de cada push; nada de secretos |

## 8. Orden de ejecución

`GitHub (rama + .gitignore)` → `Ollama (instalar + modelo)` → `Agente (server + knowledge + tools)` → `HTML (panel + fetch)` → `start.ps1 + pruebas` → `push + PR`.

## 9. Decisiones que confirma el usuario antes de ejecutar

1. ¿El repo de GitHub debe seguir público o se crea una versión privada?
2. ¿Modelo 3B rápido en CPU (recomendado) o 8B más calidad?
3. ¿El agente solo responde preguntas del proyecto o también ejecuta cálculos/simulaciones?
4. ¿Quieres que se integre en el HTML actual o prefieres primero una interfaz de chat independiente?

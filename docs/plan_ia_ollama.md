# Plan IA con Ollama (local)

Por ahora la IA corre en local con Ollama, sin Azure. Reemplaza lo "simulado" de las tareas 1.3 y 1.4 de `plan_mejoras.md`.

**Argumento para el pitch:** la IA corre en el computador del centro de acopio, sin depender de internet. Eso encaja con el principio "diseño para el campo" del caso (28 % de internet rural). En producción, el mismo contrato se apunta a Azure OpenAI cambiando una URL.

## Máquina de la demo
- 7,6 GB RAM, GPU GTX 1650 con 4 GB → modelos de ~3B parámetros cuantizados (q4) en GPU.
- Un solo modelo cargado a la vez. El de visión se carga solo cuando se usa (`keep_alive` corto).
- Ojo: Vite + navegador + modelo ya consumen buena parte de la RAM. No correr el backend Java y el modelo de visión al mismo tiempo en la demo.

## Modelos
| Uso | Modelo | Tamaño aprox. | Por qué |
|-----|--------|---------------|---------|
| Texto (extraer, chat, redactar) | `qwen3` | ~1,9 GB | Buen español, respeta JSON con esquema, cabe en la GPU |
| Respaldo si va lento | `llama3.2:3b` o `qwen3:4b` | 2,0 / 1,0 GB | Más rápido, algo menos preciso |
| Foto de remisión (opcional) | `qwen2.5vl:3b` | ~3,2 GB | Lee texto de una foto. Pesado: solo si sobra tiempo |

Verificar los nombres exactos con `ollama list` y en ollama.com antes de fijarlos.

## Arquitectura
```
React (frontend)  ──►  Servicio IA en Python (FastAPI, carpeta ia/, puerto 8000)  ──►  Ollama (localhost:11434)
      │                         │
      └─ si el servicio no responde en 8 s → reglas locales (extraerEntrega, plantillas) y etiqueta "Sin IA"
```
- El frontend nunca llama a Ollama directo: así no hay que abrir CORS en Ollama y el día de mañana se cambia a Azure OpenAI sin tocar React.
- Cada respuesta dice qué la produjo: `"motor": "ollama/qwen3"` o `"motor": "reglas"`. La UI lo muestra con la etiqueta CALCULADO / IA.
- Salida estructurada con el parámetro `format` de Ollama (esquema JSON), temperatura 0 para extraer y 0,4 para redactar.

## Endpoints del servicio IA
| Endpoint | Entrada | Salida | Pantalla |
|----------|---------|--------|----------|
| `GET /ia/salud` | — | `{ ok, modelo, motor }` | Indicador "IA local activa" en la barra lateral |
| `POST /ia/extraer` | `{ texto }` (lo que dictó Rosa) | `{ arrobas, kg, variedad, humedad, finca?, confianza, faltantes[], motor }` | Campo, WhatsApp |
| `POST /ia/chat` | `{ persona: 'rosa'\|'laura', mensajes[], contexto? }` | `{ respuesta, accion?, motor }` | WhatsApp (Rosa), copiloto de Laura |
| `POST /ia/declaracion` | `{ lotes[], fincas[] }` | `{ texto, motor }` | Cumplimiento (hoy es una plantilla) |
| `POST /ia/remision` | imagen (base64) | `{ kg, humedad, finca, fecha, confianza, motor }` | Acopio (opcional) |

Reglas para todos:
- Validar la salida contra el esquema; si no cuadra, un reintento y luego caer a reglas.
- `confianza < 0.7` o `faltantes` no vacío → la UI le pregunta a Rosa lo que falta en vez de inventar ("¿Cuántas arrobas fueron?").
- El copiloto de Laura recibe los datos de lotes y fincas en el prompt (son pocos, caben enteros) y debe citar el id del lote. Si no está en los datos, dice que no sabe.
- Nunca enviar nada fuera de la máquina. Sin registros de los textos de Rosa más allá de la sesión.

## Voz
Ollama no convierte voz a texto.
- **Demo:** voz del navegador (Chrome, `webkitSpeechRecognition`, es-CO) → texto → `/ia/extraer`. Necesita internet en el navegador: tener el botón "Usar ejemplo" de respaldo.
- **Después (offline real):** `faster-whisper` modelo `small` dentro del mismo servicio Python (`POST /ia/voz`).

## Dónde se nota la IA en la demo
1. **Rosa por WhatsApp (pantalla nueva):** manda "entregué doce arrobas y media de castillo, secadito al once" → el bot responde con la tarjeta de confirmación y pregunta lo que falta.
2. **Campo:** el dictado pasa por `/ia/extraer`; frases que las reglas no entienden ("doce arrobas y media") sí funcionan con IA. Mostrar las dos lado a lado es buen momento de pitch.
3. **Cumplimiento:** "Generar declaración" la redacta el modelo de verdad.
4. **Copiloto de Laura:** "¿Qué lotes no puedo vender a Alemania y por qué?" → responde con LT-2026-0419 y la alerta de Los Naranjos.
5. (Opcional) **Acopio:** foto de una remisión en papel → campos llenos.

## Pasos
| # | Tarea | Quién | Hecho cuando |
|---|-------|-------|--------------|
| 1 | Instalar Ollama (`winget install Ollama.Ollama`) y bajar `qwen3` | Julian | `ollama run qwen3 "hola"` responde en español |
| 2 | Medir velocidad: 10 frases de entrega → tiempo y aciertos | Claude | Tabla en este documento; objetivo < 4 s por frase en la GPU |
| 3 | Servicio `ia/` en FastAPI con `/ia/salud`, `/ia/extraer`, `/ia/chat`, `/ia/declaracion` + pruebas con frases reales | Cascada → revisa Claude | `pytest` pasa; con Ollama apagado responde con `motor: reglas` |
| 4 | Cliente `frontend/src/ia.ts` con timeout de 8 s y respaldo a reglas; indicador de IA en la barra lateral | Claude | Apagar Ollama no rompe ninguna pantalla |
| 5 | Conectar Campo, Cumplimiento y la nueva pantalla WhatsApp | Cascada → revisa Claude | Los 4 momentos de la demo funcionan con Ollama encendido |
| 6 | (Opcional) `/ia/remision` con `qwen2.5vl:3b` | Cascada | Lee una foto de remisión de prueba |
| 7 | Script de arranque de la demo: Ollama + servicio IA + frontend en un comando | Claude | `iniciar-demo.ps1` levanta todo |

## Frases de prueba (para el paso 2 y las pruebas del servicio)
- "Entregué 12 arrobas de castillo, secado al 11 por ciento"
- "doce arrobas y media de caturra"
- "150 kilos de cenicafé uno, humedad 11,5"
- "le traje como 8 arrobitas de la finca la esperanza"
- "hoy no entregué nada"  → debe devolver faltantes, no inventar
- "3 bultos de pergamino seco" → bulto no es arroba: preguntar

## Decisiones pendientes
1. ¿El servicio Python lo hace tu compañera (stack acordado: Python para IA) o lo hace la cascada en esta rama?
2. ¿Se usa el modelo de visión para la remisión o se deja fuera por la RAM?

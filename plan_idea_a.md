# Plan Idea A: CaféExport AI — Asistente de Regulaciones

## 1. Nombre
**CaféExport AI** — Tu asesor de exportación de café, disponible 24/7.

## 2. Problema que resuelve
Los exportadores colombianos de café tostado pierden dinero y tiempo por desconocer las regulaciones específicas de cada país destino. Un error en documentación o etiquetado puede significar que un contenedor completo sea rechazado en puerto. No existe una fuente centralizada y accesible que les diga exactamente qué necesitan para exportar a cada mercado.

## 3. Stack técnico (Microsoft)
- **Azure OpenAI Service** (GPT-4o) — motor del chatbot
- **Azure AI Search** — índice vectorial para RAG sobre documentos de regulación
- **Azure Blob Storage** — almacén de PDFs y documentos de regulación
- **Azure App Service** — hosting de la app web
- **Azure Cosmos DB** — historial de consultas y perfiles de exportador (opcional para MVP)

## 4. Arquitectura

```
[Usuario/Exportador]
        │
        ▼
[App Web (React/Next.js en App Service)]
        │
        ▼
[API Backend (Python FastAPI en App Service)]
        │
        ├──► [Azure AI Search] ──► [Blob Storage: docs regulación]
        │         │
        │         ▼
        └──► [Azure OpenAI GPT-4o] ──► Respuesta contextualizada
```

Flujo: el usuario pregunta → el backend busca documentos relevantes en AI Search → inyecta contexto en el prompt → GPT-4o genera respuesta con fuentes.

## 5. MVP para el hackathon (1-2 días)

**Se construye:**
- Chatbot web funcional con 3-5 países cargados (EE.UU./FDA, Alemania, UE general)
- RAG con ~20-30 documentos de regulación (FDA food facility registration, etiquetado, fitosanitarios)
- Interfaz limpia con logo y branding café
- 3 flujos demo: "exportar tostado a EE.UU.", "requisitos de etiquetado UE", "documentos para Alemania"

**Se deja fuera:**
- Perfiles de usuario y login
- Cálculo de costos reales de envío
- Integración con sistemas aduaneros
- Más de 5 países
- App móvil nativa

## 6. Implementación paso a paso

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Recopilar documentos de regulación (FDA, UE, Alemania) — PDFs, páginas web | 3h |
| 2 | Crear recurso Azure OpenAI + Azure AI Search + Blob Storage | 1h |
| 3 | Subir documentos a Blob, indexar en AI Search con chunking | 2h |
| 4 | Backend API: endpoint /chat con RAG (Python FastAPI) | 3h |
| 5 | Prompt engineering: system prompt con contexto cafetero | 1h |
| 6 | Frontend: interfaz de chat con React | 3h |
| 7 | Deploy en Azure App Service | 1h |
| 8 | Testing con preguntas reales de exportadores | 1h |
| 9 | Preparar pitch y demo grabado | 1h |
| **Total** | | **16h** |

## 7. Demo/Pitch

Mostrar a los jueces:
1. **Problema:** "Un error en la etiqueta de café tostado para EE.UU. puede costar $5,000+ en un contenedor rechazado"
2. **Demo en vivo:** preguntar al chatbot "¿Qué necesito para exportar 500 kg de café tostado molido a Nueva York?"
3. **Respuesta del bot:** lista de requisitos FDA, registro de food facility, etiquetado en inglés, certificado fitosanitario ICA, documentos de aduana
4. **Segundo ejemplo:** "¿Cuál es la diferencia de requisitos entre exportar a Alemania vs España?"
5. **Cierre:** "Hoy esto requiere un abogado de comercio exterior. CaféExport AI lo democratiza."

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Documentos de regulación desactualizados | Disclaimer visible + fecha de última actualización por documento |
| Respuestas incorrectas del modelo | RAG limita alucinaciones; agregar "consulte con su agente aduanero" |
| No tener acceso a Azure OpenAI a tiempo | Usar API de OpenAI directo como fallback, migrar después |
| Pocos documentos para el RAG | Calidad > cantidad; 20 docs bien chunkeados bastan para el demo |
| El demo no impresiona | Preparar preguntas "wow" que muestren profundidad |

## 9. Evaluación

| Criterio | Calificación | Razón |
|----------|-------------|-------|
| **Viabilidad** | ✅ Alta | RAG + chatbot es un patrón probado, construible en 1-2 días |
| **Impacto** | ✅ Alto | Problema real pedido textualmente por ASOEXPORT |
| **Wow factor** | 🟡 Medio | Los chatbots ya no sorprenden, pero el contenido específico sí |
| **Uso de tech Microsoft** | ✅ Alto | Azure OpenAI + AI Search + App Service = stack completo |
| **Escalabilidad** | ✅ Alta | Agregar países = agregar documentos, sin cambiar código |

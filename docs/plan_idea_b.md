# Plan Idea B: CaféCredit — Inclusión Financiera para Caficultores

## 1. Nombre
**CaféCredit** — Score crediticio alternativo para caficultores colombianos

## 2. Problema que resuelve
Los caficultores colombianos no tienen historial crediticio formal (pagan en efectivo/Nequi), lo que los excluye del sistema financiero (Banco Agrario, Finagro). Sin crédito no pueden fertilizar ni tecnificar, y sin tecnificar no producen más — un círculo vicioso que aleja a los jóvenes del campo.

## 3. Stack técnico (Microsoft)
| Componente | Tecnología |
|---|---|
| Backend / API | Azure Functions (Python) |
| Modelo de scoring | Azure Machine Learning |
| Base de datos | Azure Cosmos DB |
| IA conversacional | Azure OpenAI (GPT-4o) |
| Dashboard de resultados | Power BI Embedded |
| Frontend | Azure Static Web Apps (React) |
| Datos climáticos | Azure Maps / Weather API |
| Autenticación | Azure AD B2C |

## 4. Arquitectura

```
Caficultor (móvil/web)
       │
       ▼
  Azure Static Web App (React)
       │
       ├── Azure OpenAI ──► Chatbot guía al caficultor
       │                     para ingresar sus datos
       ▼
  Azure Functions (API)
       │
       ├── Cosmos DB ──► Perfil del caficultor
       │                  (finca, producción, ventas)
       │
       ├── Azure ML ──► Modelo de scoring crediticio
       │                  (inputs: hectáreas, producción,
       │                   variedad, clima, ventas)
       │
       ├── Weather API ──► Datos climáticos de la zona
       │
       └── Power BI ──► Reporte visual del score
                         para el banco/Finagro
```

**Flujo:**
1. Caficultor entra → chatbot le pregunta datos en lenguaje simple
2. API guarda perfil en Cosmos DB y consulta clima de su zona
3. Azure ML calcula score con modelo entrenado en datos sintéticos
4. Se genera reporte Power BI con el score, factores de riesgo y recomendación
5. El caficultor descarga/comparte el reporte con su banco

## 5. MVP para el hackathon (1-2 días)

**Se construye:**
- Chatbot Azure OpenAI que recolecta datos del caficultor (nombre, municipio, hectáreas, producción, variedad, gastos)
- Modelo de scoring simple (reglas + pesos, no ML real) que genera un score 0-100
- Dashboard con el score, semáforo de riesgo y los factores que lo componen
- 3 perfiles demo precargados (finca chica/mediana/grande)
- Landing page con el pitch

**Se deja fuera:**
- ML real (se usa scoring basado en reglas ponderadas)
- Integración con Banco Agrario / Finagro (no hay API)
- Verificación de datos del caficultor
- Azure AD B2C (login con código simple o sin login)
- Datos climáticos reales (se usan datos demo por municipio)

## 6. Paso a paso de implementación

| # | Tarea | Horas | Quién |
|---|---|---|---|
| 1 | Definir variables del scoring y pesos (hectáreas, producción/ha, variedad, zona climática, años de experiencia, gastos) | 1h | Todos |
| 2 | Crear Azure Static Web App + estructura React básica | 1h | Frontend |
| 3 | Crear Azure Function con endpoint `/score` que recibe datos y devuelve score | 2h | Backend |
| 4 | Configurar Azure OpenAI con prompt de chatbot recolector de datos | 2h | Backend |
| 5 | Integrar chatbot en el frontend (conversación → formulario → score) | 2h | Frontend |
| 6 | Crear dashboard de resultados (score, semáforo, factores, recomendación) | 2h | Frontend |
| 7 | Cargar datos demo (3 perfiles, datos climáticos por municipio del Huila) | 1h | Backend |
| 8 | Crear Cosmos DB y conectar persistencia de perfiles | 1h | Backend |
| 9 | Power BI Embedded con reporte descargable del score | 2h | Backend |
| 10 | Pulir UI, landing page y preparar pitch | 2h | Todos |
| **Total** | | **~16h** | |

## 7. Demo / Pitch

**Guion del demo (5 min):**
1. "Doña María tiene 3 hectáreas de café en Pitalito, Huila. Nunca ha tenido una cuenta bancaria."
2. Abrir la app → el chatbot pregunta: ¿cuántas hectáreas tiene? ¿qué variedad? ¿cuánto produce por cosecha?
3. El chatbot convierte respuestas en datos estructurados
4. Se genera el score: 72/100 — riesgo medio-bajo
5. Mostrar el dashboard: factores positivos (variedad resistente, zona con buen clima), factores de riesgo (finca pequeña, sin riego)
6. Mostrar reporte Power BI descargable: "esto es lo que Doña María le lleva al Banco Agrario"
7. Comparar con perfil de finca grande tecnificada (score 91) y finca en zona de riesgo climático (score 45)
8. Cierre: "837,000 hectáreas de café, miles de caficultores invisibles para el sistema financiero. CaféCredit los hace visibles."

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Modelo de scoring sin datos reales | Demo poco creíble | Usar rangos reales de CENICAFÉ para los datos sintéticos; documentar la metodología |
| Power BI Embedded toma tiempo de configurar | Se pierde tiempo en setup | Alternativa: dashboard HTML simple con Chart.js si Power BI no coopera |
| "¿Y el banco realmente usaría esto?" | Jueces escépticos | Enmarcar como piloto/prueba de concepto; mencionar Open Banking y tendencias de scoring alternativo |
| Azure OpenAI puede alucinar datos | Respuestas incorrectas del chatbot | Prompt estricto con validación de rangos; el chatbot solo recolecta, no inventa |
| Sin internet en fincas rurales | "No funciona en el campo" | MVP es web, pero mencionar que podría ser WhatsApp bot offline-first en v2 |

## 9. Evaluación

| Criterio | Calificación | Justificación |
|---|---|---|
| **Viabilidad hackathon** | **Media** | El scoring por reglas es construible en 1-2 días, pero Power BI y los datos demo creíbles pueden consumir tiempo |
| **Impacto** | **Alto** | Ataca un problema estructural real mencionado múltiples veces en el evento. Inclusión financiera + relevo generacional |
| **Wow factor** | **Medio** | El chatbot que genera un score es interesante, pero no tiene el "wow" visual de un mapa o video. El impacto social compensa |
| **Fit con Microsoft** | **Alto** | Usa Azure OpenAI, Azure ML, Cosmos DB, Power BI, Static Web Apps — todo el ecosistema |
| **Diferenciador** | **Alto** | Scoring alternativo para agro es un nicho que nadie ha resuelto bien. No es "otro chatbot" |

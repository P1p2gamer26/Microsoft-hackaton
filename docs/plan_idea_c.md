# Plan Idea C: CaféRuta — Optimizador Logístico de Exportación

## 1. Problema que resuelve

Los exportadores de café del Huila eligen puerto y ruta por costumbre, no por datos. El café tostado se degrada en tránsito y no hay herramienta que compare costo, tiempo y frescura entre las opciones (Buenaventura, Cartagena, Santa Marta). Resultado: márgenes perdidos y producto que llega en peor estado del necesario.

## 2. Stack técnico (Microsoft)

- **Azure Maps** — cálculo de rutas terrestres, distancias y tiempos entre municipios y puertos
- **Azure OpenAI (GPT-4o)** — recomendaciones en lenguaje natural, análisis de regulaciones por destino
- **Azure Static Web Apps** — hosting del dashboard (React o HTML estático)
- **Azure Functions** — backend serverless para cálculos de costos y degradación
- **Cosmos DB** — datos de referencia: puertos, tarifas estimadas, destinos, regulaciones
- **Power BI Embedded** (opcional) — visualización de comparativas si da el tiempo

## 3. Arquitectura

```
[Frontend: Dashboard SPA]
        |
  [Azure Functions API]
   /         |          \
Azure Maps  Cosmos DB   Azure OpenAI
(rutas)     (tarifas,   (recomendación
             puertos)    + regulaciones)
```

El usuario ingresa: municipio de origen, tipo de café, cantidad (sacos), destino final. El backend consulta Azure Maps para rutas a los 3 puertos, Cosmos DB para tarifas estimadas, calcula degradación de frescura según tiempo de tránsito, y Azure OpenAI genera una recomendación contextualizada.

## 4. MVP para el hackathon (1-2 días)

**Se construye:**
- Formulario: origen (dropdown de municipios del Huila), tipo café (verde/tostado), cantidad, destino (EE.UU./Alemania/China)
- Mapa con las 3 rutas a los puertos pintadas con colores (verde=mejor, rojo=peor)
- Tabla comparativa: puerto | distancia | tiempo | costo estimado | frescura al llegar
- Recomendación en texto generada por Azure OpenAI
- Datos hardcodeados pero realistas de tarifas y tiempos marítimos

**Se deja fuera:**
- Integración real con navieras o transportadoras
- Datos de tarifas en tiempo real
- Usuarios, login, historial
- Power BI (solo si sobra tiempo)

## 5. Paso a paso de implementación

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Setup: Azure Static Web App + Azure Functions + Cosmos DB | 2h |
| 2 | Seed de datos en Cosmos DB: municipios del Huila, 3 puertos, tarifas estimadas por saco, tiempos marítimos a EE.UU./Alemania | 1.5h |
| 3 | Frontend: formulario de entrada + layout del dashboard | 2h |
| 4 | API: función que recibe parámetros y consulta Azure Maps para las 3 rutas | 2h |
| 5 | API: cálculo de costo (flete terrestre + marítimo) y modelo de degradación de frescura (simple: días × factor por tipo de café) | 2h |
| 6 | Integración Azure OpenAI: prompt que recibe los datos calculados y genera recomendación + tips de regulación del destino | 1.5h |
| 7 | Frontend: mapa con rutas, tabla comparativa, card de recomendación AI | 3h |
| 8 | Pulir UI, datos de demo, preparar pitch | 2h |
| **Total** | | **~16h** |

## 6. Demo/Pitch

1. Abrir el dashboard, seleccionar "Pitalito, Huila" → "café tostado" → "500 sacos" → "Estados Unidos"
2. Se pintan 3 rutas en el mapa con tiempos y costos
3. Tabla muestra: Buenaventura es más barato pero el café llega con 15% menos frescura que por Cartagena (ruta más rápida por mar)
4. La IA recomienda Cartagena para tostado por mejor balance costo/frescura, y lista requisitos FDA
5. Cambiar a "café verde" → la recomendación cambia a Buenaventura (el verde aguanta más)
6. Narrativa: "Hoy el exportador pierde plata por elegir a ciegas. CaféRuta le da la respuesta en 10 segundos."

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Datos de tarifas no son reales | Usar estimaciones del sector (Federación publica promedios). Disclaimar en el pitch que el MVP usa datos de referencia |
| Azure Maps no tiene rutas terrestres detalladas en zonas rurales del Huila | Usar puntos de cabecera municipal como origen, no finca exacta |
| El demo parece "Google Maps bonito" sin profundidad | El diferenciador es el modelo de frescura + la IA que cruza regulaciones. Enfatizar eso |
| Poco tiempo para 3 integraciones (Maps + Cosmos + OpenAI) | Degradar gracefully: si Maps falla, usar distancias hardcodeadas. El core es la comparativa |

## 8. Evaluación

| Criterio | Score | Nota |
|----------|-------|------|
| **Viabilidad hackathon** | Media | 16h es justo; funciona si el equipo se divide bien (1 frontend, 1 backend/Azure) |
| **Impacto** | Medio | Resuelve un dolor real pero nicho (exportadores, no caficultores). Menos emocional que inclusión financiera |
| **Wow factor** | Alto | El mapa con rutas + IA recomendando es visualmente potente en un pitch |
| **Uso de tech Microsoft** | Alto | Azure Maps, OpenAI, Functions, Cosmos — todo core de Azure |

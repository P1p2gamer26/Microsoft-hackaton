# Análisis Reto 1: Modernización de la Finca Cafetera

## Resumen
El reto busca usar tecnología para hacer la finca cafetera rentable y atractiva para jóvenes, que lideren su modernización y vean futuro en el campo. Es un problema de adopción tecnológica + relevo generacional en el agro colombiano.

## Pros de elegir este reto

1. **Alto impacto social** — toca relevo generacional, un dolor real del campo colombiano. Los jueces lo van a sentir.
2. **Encaja perfecto con Azure AI** — visión por computadora para plagas, modelos predictivos de cosecha, IoT para monitoreo de suelo/clima. Microsoft tiene servicios listos para esto.
3. **Datos públicos disponibles** — FNC, IDEAM, DANE tienen datasets de clima, producción, precios. No dependes de datos privados para el demo.
4. **Narrativa fuerte para pitch** — "jóvenes volviendo al campo con tecnología" vende. Es aspiracional, visual, fácil de contar en 5 minutos.
5. **Diferenciación clara** — pocos equipos en un hackathon Microsoft van a ir por agro. Menos competencia directa.

## Contras de elegir este reto

1. **Demo difícil sin hardware** — IoT, sensores, drones suenan bien pero en 1-2 días no puedes mostrar nada físico. Queda todo en mockups.
2. **Problema muy amplio** — "modernizar la finca" puede ser 50 cosas. Riesgo de querer abarcar mucho y no cerrar nada concreto.
3. **Usuario final lejano** — el caficultor joven rural no está en el hackathon. No puedes validar si lo que construyes le sirve.
4. **Competencia con soluciones existentes** — Cenicafé, apps de FNC, Cropster ya tienen herramientas. Hay que justificar por qué algo nuevo.
5. **Complejidad del dominio** — agronomía del café tiene muchas variables (altitud, variedad, proceso, suelo). Sin experto en el equipo, el modelo puede ser superficial.

## Qué se podría construir en 1-2 días

- **Dashboard con Azure AI + Power BI**: predicción de precio del café + recomendaciones de momento óptimo de venta. Datos de FNC + modelo en Azure ML.
- **Chatbot con Azure OpenAI**: asistente técnico para el caficultor joven. Responde sobre plagas, fertilización, buenas prácticas. RAG sobre documentos de Cenicafé.
- **App móvil con Azure Computer Vision**: foto de la hoja → diagnóstico de roya/broca. Transfer learning sobre modelo preentrenado.
- **Simulador financiero**: "¿cuánto gano si cambio de variedad / proceso?" con datos reales de costos y precios.

Lo más viable en 1-2 días: el chatbot con RAG o el simulador financiero. El de visión necesita dataset etiquetado que no vas a armar en un hackathon.

## Veredicto: Viabilidad MEDIA

**Por qué media y no alta**: el problema es amplio y el demo más convincente (IoT, visión) requiere datos/hardware que no tendrás. Puedes entregar algo funcional (chatbot, dashboard), pero el "wow factor" depende de qué tan bien acotes el scope. Si el equipo logra enfocarse en UN dolor específico del caficultor joven (ej: "no sé cuándo vender mi cosecha"), sube a alta.

# Plan de mejoras CaféTrace

Base: evaluación independiente y revisión propia (27-nov-2026). CaféTrace es la columna del pitch porque responde la pregunta oficial. De Coffee Value Bridge (CVB) se toma solo lo que suma.

Pregunta del caso: **¿Cómo puede la IA ayudar a construir trazabilidad desde fincas pequeñas, con poca señal y baja adopción digital?**

## Fase 0 · Cerrar lo que está en curso
| # | Tarea | Quién | Hecho cuando |
|---|-------|-------|--------------|
| 0.1 | Pantallas Campo, Acopio, Cumplimiento, Lote, Ayuda (cascadas en curso) | Cascada → revisa Claude | Compilan, se prueban en el navegador y se fusionan en `julian/frontend-3d` |
| 0.2 | Contrato de API para el backend a partir de `frontend/src/datos.ts` | Claude | `docs/api.md` con los endpoints de abajo, entregado a la compañera de Spring Boot |

Endpoints propuestos (Spring Boot):
- `GET /api/fincas` · `GET /api/lotes` · `GET /api/lotes/{id}`
- `POST /api/eventos`: registra un evento de un lote (cosecha, acopio…)
- `POST /api/sync`: recibe la cola offline del celular y devuelve lo aceptado
- `GET /api/lotes/{id}/epcis`: documento EPCIS 2.0 del lote
- Servicio Python: `POST /ia/extraer` (texto o voz → entrega estructurada) y `POST /ia/verificar-poligono` (polígono → alerta de deforestación)

## Fase 1 · Lo que gana la demo (prioridad máxima)
| # | Tarea | Por qué |
|---|-------|---------|
| 1.1 | **Modo sin señal real en Campo**: service worker propio (sin librerías) que guarda la app, más la cola en IndexedDB o localStorage que se envía al volver la señal | La demo en modo avión es lo que más separa al equipo. Principio 2 del caso |
| 1.2 | **WhatsApp simulado**: pantalla de chat donde Rosa manda una nota de voz o foto y el bot responde con el lote registrado | Principio 2 (canales de bajo consumo). Celulares gama media |
| 1.3 | **IA en un flujo visible (por ahora Ollama local, ver `plan_ia_ollama.md`)**: Azure AI Speech (voz a texto es-CO) y Azure OpenAI para convertir el texto en dato estructurado. Si no hay créditos: voz del navegador + extractor local, rotulado "simulado" | El jurado pregunta primero "¿dónde está la IA?". Hoy puntúa 3/10 |
| 1.4 | **Lectura de remisión en papel**: subir foto → Azure AI Vision / Document Intelligence extrae kg, humedad y finca | Segundo flujo de IA. Ataca la informalidad del acopio |

## Fase 2 · Quitar riesgos de la demo
| # | Tarea | Hecho cuando |
|---|-------|--------------|
| 2.1 | Animación del mapa a ~15 fps; se pausa con la pestaña oculta y respeta `prefers-reduced-motion` | Un celular gama media no se calienta |
| 2.2 | Cargar cada pantalla por separado (`React.lazy`) para que MapLibre no pese en Campo | La primera carga de Campo baja de 1,3 MB a menos de 300 KB |
| 2.3 | Mapa sin red: mensaje claro si no cargan las imágenes, más un video de respaldo del recorrido | El pitch no depende del wifi del evento |
| 2.4 | Polígonos realistas e irregulares (6–10 vértices) en vez del cuadrilátero repetido | Ningún jurado técnico nota datos de juguete |
| 2.5 | Evaluar Azure Maps para la imagen satelital (si hay llave) en lugar de Esri | Suma puntos Microsoft y quita el riesgo de licencia |
| 2.6 | Probar todo en un celular real gama media y en Chrome con red 3G simulada | Captura de pantalla de cada vista en celular |

## Fase 3 · Traer lo mejor de Coffee Value Bridge
| # | Tarea | Hecho cuando |
|---|-------|--------------|
| 3.1 | Componente de etiqueta de origen del dato: REAL / DEMO / CALCULADO / ESTIMADO, usado en todas las cifras | Ninguna cifra sin etiqueta |
| 3.2 | Pantalla **Compradores** (React, tema oscuro): puntaje de compatibilidad lote ↔ comprador, con el plus "cumple EUDR" para compradores de la UE | Es el puente "trazabilidad → mejor precio" del pitch |
| 3.3 | Comparador café verde vs. tostado dentro de Compradores | Responde la pregunta del Reto 2 sin abrir otro producto |
| 3.4 | Si el HTML de CVB se sigue usando: escapar el texto del chat (hoy se puede inyectar código) y quitar "arrastra mentalmente las tarjetas" | Sin XSS en la demo |

## Fase 4 · Lo que el jurado pregunta y hoy falta
| # | Tarea |
|---|-------|
| 4.1 | Pantalla **Gobernanza del dato**: consentimiento de Rosa al registrar su finca, quién ve qué (caficultor, cooperativa, exportador, comprador), derecho a retirar el dato |
| 4.2 | Hoja de ruta por etapas: 1) dato y trazabilidad por lote → 2) verificación satelital → 3) sensores IoT y analítica |
| 4.3 | Modelo de negocio y costos: quién paga (Asoexport / exportadora por lote trazado), costo Azure estimado por 10.000 fincas |
| 4.4 | Métricas de impacto: % de lotes con polígono, horas sin papel, lotes aceptados en la UE |
| 4.5 | Guion del pitch de 5 minutos (abajo) y video de respaldo de toda la demo |

## Pitch de 5 minutos
1. **0:00 Gancho**: "Si la UE rechaza un lote, ¿de qué finca venía?" 25–27 % de las exportaciones en juego.
2. **0:30 Rosa**: celular en modo avión, registra la cosecha hablando y por WhatsApp; queda en cola.
3. **1:15 Hernán**: arma el lote con QR, sin papel, y lee una remisión con foto.
4. **2:00 Mapa 3D**: fincas, alerta de deforestación en rojo, ruta animada a Buenaventura.
5. **3:00 Laura y Anke**: panel EUDR, exportar EPCIS, pasaporte del lote con QR que escanea el jurado.
6. **3:45 Puente**: "con el lote trazado, sabes a quién vendérselo": Compradores y comparador verde/tostado.
7. **4:30 Cierre**: IA de Azure en cada paso, gobernanza, hoja de ruta, impacto.

## Reparto en paralelo (máx. 3 cascadas, sin tocar los mismos archivos)
Cuando terminen las cascadas de la Fase 0:
- **Tanda A**: 1.1 + 1.2 (Campo, offline, WhatsApp) · 2.1 + 2.2 + 2.4 (Mapa3D, App, datos) · 3.1 + 3.2 + 3.3 (Compradores, componente de etiqueta)
- **Tanda B**: 1.3 + 1.4 (servicio de IA, cuando haya llaves de Azure) · 4.1 + 4.2 (Gobernanza, Ayuda) · 2.3 + 2.6 (respaldo y pruebas en celular)
- Claude: contrato de API (0.2), revisión de cada entrega, guion y video (4.5).

## Decisiones pendientes de Julian
1. ¿Hay cuenta de Azure con créditos (Speech, OpenAI, Vision, Maps)? Define si 1.3, 1.4 y 2.5 son reales o simulados.
2. ¿Cuándo es la presentación? Define cuántas tandas caben.
3. ¿Qué endpoints alcanza a hacer la compañera en Spring Boot? Si no llega, la demo usa los datos de `datos.ts`.

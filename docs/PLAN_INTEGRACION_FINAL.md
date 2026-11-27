# Plan de integración final — CaféTrace + Coffee Value Bridge

> Estado: **plan actualizado al 27/11/2026**. Complementa `plan_union.md` (visión original) con lo que ya está fusionado y lo que falta para que la demo se vea como **un solo producto** y funcione también en Render.

## 1. Decisión de producto

**Un solo producto: CaféTrace.** Coffee Value Bridge deja de ser "otra app" y pasa a ser el **motor comercial e inteligente** de CaféTrace.

| Pieza | Papel en el producto | Lo que aporta |
|---|---|---|
| **CaféTrace** (frontend React/Vite) | La cara y la historia | Trazabilidad finca → puerto, EUDR, cola sin señal, mapa 3D, personas Rosa/Hernán/Laura/Anke |
| **Coffee Value Bridge** (Spring Boot) | El motor | JWT + multiempresa, ~40 endpoints, módulo de trazabilidad, compradores, comparador verde/tostado, copiloto regulatorio, reportes |
| **Analytics** (Python/Flask) | Cálculos pesados | GIS (compradores cercanos a centros) y Time to Market |
| **Agente IA** (Python + Ollama) | Copiloto con citas | Responde sobre los documentos del proyecto, usa herramientas de cálculo y funciona sin internet en local |

**Relato de la demo:** la trazabilidad de CaféTrace abre el mercado europeo (EUDR) y el motor de Coffee Value Bridge convierte ese lote ya trazado en una venta al comprador correcto, con precio y márgen calculados.

## 2. Estado real del repo

| Ítem | Estado | Evidencia |
|---|---|---|
| Ramas fusionadas (`origin/main` + `julian/frontend-3d`) | ✅ | Commits `6bf48c66`, `c140bf1c`, rama `feature/agente-local-ollama`, PR #1 |
| Frontend único con `HashRouter`, persona y cliente API con respaldo demo | ✅ | `frontend/src/App.tsx`, `api.ts`, `persona.tsx` |
| Backend con módulo `trazabilidad` y pruebas | ✅ | `backend/.../trazabilidad/**`, `TrazabilidadController` |
| Endpoints comerciales / inteligencia / copiloto | ✅ | `CommercialController`, `IntelligenceController`, `OperationsController` |
| Agente local Ollama (`qwen2.5:3b-instruct`) con citas y tool-calling | ✅ | `agent/server.py`, `/api/health`, `/api/chat` en `127.0.0.1:8000` |
| Modo offline del agente (sin Ollama, para la nube) | ✅ | `mode: offline` con fragmentos indexados y fuentes |
| Blueprint de Render (web + api + agente + Postgres/PostGIS) | ✅ | `render.yaml`, `DEPLOY.md` |
| Backend corriendo en local con JDK 21 + H2 | 🔄 de validación | dependencias Maven descargándose en el arranque |
| `iniciar-demo.ps1` (un comando para levantar todo) | ❌ | no existe todavía |
| Pantallas conectadas a Buyers / Comparador / Copiloto | ❌ | `Compradores.tsx` aún usa `datos.ts` con etiqueta "demo"; no hay pantalla de Comparador ni de Copiloto |
| IA aplicada a Campo y Declaración EUDR | ❌ | hay plan en `plan_ia_ollama.md`, pero los endpoints `/ia/*` no existen |
| Analytics desplegado en Render | ❌ | el servicio Flask no está en `render.yaml` |
| Guion de pitch y video de respaldo | ❌ | borrador en `plan_mejoras.md` |

## 3. Arquitectura objetivo

```text
LOCAL (demo completa, sin internet)
  navegador ──▶ frontend Vite :5173
                  ├─▶ backend Spring Boot :8080  (H2, JWT, /api/v1/**)
                  ├─▶ agente Python :8000        (Ollama :11434 + citas)
                  └─▶ analytics Flask :8001      (GIS + TTM)
  Si un servicio no responde → el frontend cae a datos demo con etiqueta "DEMO",
  y el agente cae a modo "offline" con citas. La demo nunca se rompe.

RENDER (demo pública)
  cvb-hackaton-web  ──▶ cvb-hackaton-api   ──▶ cvb-hackaton-db (Postgres 16 + PostGIS)
                    └─▶ cvb-hackaton-agente (modo offline, sin Ollama)
                    └─▶ cvb-hackaton-analytics (GIS + TTM)
```

**Regla de oro:** el frontend nunca habla con Ollama directo; siempre pasa por el agente (`/api/chat`, `/api/extract`, `/api/declaration`). Así el día de mañana se cambia Ollama por Azure OpenAI sin tocar React.

## 4. Trabajo por tandas

### Tanda A — Arranque en un comando (30 min)
**Archivo:** `iniciar-demo.ps1` en la raíz.

1. Detectar JDK 21 y Maven (`C:\Program Files\Eclipse Adoptium\jdk-21*`, o PATH).
2. Levantar, si no están vivos: Ollama, backend (`mvn spring-boot:run`, perfil `local`), analytics (`uvicorn`/`python app.main:app` según su Dockerfile), agente (`agent/server.py`) y frontend (`npm run dev`).
3. Esperar a `/actuator/health`, `/api/health`, `/health` y `http://localhost:5173` antes de abrir el navegador.
4. Imprimir un cuadro con las 4 URLs y el estado de cada servicio.

**Hecho cuando:** con todo apagado, `.\iniciar-demo.ps1` deja la demo usable en menos de 3 minutos (salvo primera descarga de dependencias).

### Tanda B — Conectar lo que falta del motor comercial (1–2 h)
**Archivos:** `frontend/src/paginas/Compradores.tsx`, nuevo `frontend/src/paginas/Comparador.tsx`, nuevo `frontend/src/paginas/Copiloto.tsx`, `App.tsx`, `api.ts`.

1. **Compradores:** reemplazar `compradoresDemo` por `GET /api/v1/buyers` (con token demo), manteniendo respaldo a `datos.ts` y la etiqueta `DEMO`/`API` que ya existe.
2. **Comparador:** pantalla nueva con el payload de `POST /api/v1/comparator/simulate` ( verde 4.8 USD/kg vs tostado 11 USD/kg, costo 3.5 + tostión 1.2, merma 15 %). Mostrar utilidad y capital necesario.
3. **Copiloto:** panel con `POST /api/chat` del agente. Mostrar `answer`, `sources` (clicables) y `mode` (`tools` / `direct` / `context` / `offline`). El motor de reglas del backend (`POST /api/v1/copilot/analyze`) queda como respaldo y se etiqueta como tal.
4. Registrar las tres rutas nuevas en el menú, filtradas por persona (Laura/Anke ven Compradores y Comparador; Hernán, el copiloto de campo).

**Hecho cuando:** apagando el backend las pantallas siguen mostrando datos demo con etiqueta; encendiéndolo, muestran datos reales y el copiloto cita fuentes.

### Tanda C — IA en el flujo de campo y cumplimiento (2 h)
**Archivos:** `agent/server.py`, `frontend/src/paginas/Campo.tsx`, `Cumplimiento.tsx`, nuevo `frontend/src/ia.ts`.

1. Añadir al agente, usando el mismo patrón de `/api/chat` con fallback:
   - `POST /api/extract` → `{ kg, variedad, humedad, confianza, faltantes[], motor }`.
   - `POST /api/declaration` → `{ texto, motor }` a partir de lotes/fincas.
2. `ia.ts`: timeout de 8 s y respaldo a las reglas locales (`extraerEntrega`, plantilla de declaración). Etiqueta `IA`/`REGLAS` en la UI.
3. Campo: el dictado de Rosa pasa por `/api/extract`; si `faltantes` no está vacío, la UI pregunta en vez de inventar.
4. Cumplimiento: "Generar declaración" usa `/api/declaration` y deja editable el texto.

**Hecho cuando:** con Ollama apagado, Campo y Cumplimiento siguen funcionando con `motor: reglas`; con Ollama encendido, las frases de prueba de `plan_ia_ollama.md` se extraen bien.

### Tanda D — Deploy completo con BD (1 h)
**Archivos:** `render.yaml`, `DEPLOY.md`.

1. Añadir `cvb-hackaton-analytics` (`runtime: docker`, `dockerfilePath: ./analytics/Dockerfile`, `healthCheckPath: /health`) con `dockerContext: .`.
2. En `cvb-hackaton-api`, añadir `ANALYTICS_SERVICE_URL` con `fromService` → `RENDER_EXTERNAL_URL` del analytics (el backend ya lee esa variable).
3. Sincronizar el Blueprint, esperar a que los 5 recursos estén `Live` y verificar:
   - `/actuator/health` → `UP` (confirma JDBC y Flyway/PostGIS).
   - `/api/v1/trazabilidad/fincas` y `/api/v1/buyers` con token demo.
   - `/api/health` y `/api/chat` del agente (`mode: offline`).
   - `/health` del analytics.
   - Frontend con las 4 URLs inyectadas y menú completo.

**Hecho cuando:** la demo pública se abre sin errores y los datos vienen de Postgres, no de `datos.ts`.

### Tanda E — Cierre de demo (30 min)
1. Guion de 5 minutos: 0:00 problema EUDR → 1:00 Rosa sin señal → 2:00 mapa y lotes → 3:00 declaración/copiloto → 4:00 comprador y comparador → 4:45 cierre "mismo lote, mejor precio".
2. Video de respaldo grabado.
3. Limpieza (coordinar con el equipo, **no tocar `main` sin acuerdo**): mover `coffee-value-bridge - Copy/` a `legacy/` y sacar del control de versiones sus `node_modules` y `backend/target`, y cualquier `*.db`.

## 5. Riesgos y decisiones pendientes

1. **Nombre del producto:** la decisión tomada es CaféTrace; confirmar con la compañera antes del pitch.
2. **Licencia de la BD free de Render:** expira a los 30 días; renovar o pasar a plan pago antes de la presentación.
3. **Sueño de los servicios free:** el primer request tras 15 min tarda ~1 min; calentar las URLs justo antes de la demo.
4. **Ollama en Render:** no corre en el plan free; en la nube el copiloto usa modo offline con citas. La demo de IA completa se hace en local.
5. **RAM local:** no abrir el modelo de visión ni otro modelo grande mientras estén Java + Vite + Ollama cargados.
6. **Limpieza de `main`:** cambia archivos compartidos; requiere acuerdo del equipo.

## 6. Definition of done

- [ ] `.\iniciar-demo.ps1` levanta todo y pasa los 4 health checks.
- [ ] `npm run build` y `mvn test` pasan en la rama.
- [ ] Las 3 pantallas nuevas hablan con el backend y caen a demo con etiqueta.
- [ ] `/api/extract` y `/api/declaration` tienen motor `ollama` y `reglas` probados.
- [ ] Los 5 servicios de Render están `Live` y la BD responde con datos sembrados.
- [ ] Guion y video de respaldo listos; PR #1 aprobada y fusionada a `main`.

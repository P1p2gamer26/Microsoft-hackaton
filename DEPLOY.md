# Deploy en Render — Coffee Value Bridge

Render es el destino elegido porque el proyecto tiene **backend Spring Boot** y una base de datos; GitHub Pages solo sirve archivos estáticos.

## Archivos del deploy

- `render.yaml`: Blueprint con 3 servicios + 1 base de datos.
- `backend/Dockerfile`: construye el JAR con Maven y corre Spring Boot.
- `agent/Dockerfile`: corre el agente Python con `Propuesta.md` y `docs/` dentro de la imagen.
- `frontend/vite.config.ts`: `base: './'` para que los assets funcionen en el CDN.
- `frontend/src/App.tsx`: `HashRouter` para que las rutas no dependan de reescrituras del servidor.

## Qué se crea

| Servicio | Tipo | URL estimada |
|---|---|---|
| `cvb-hackaton-web` | Static Site (Vite) | `https://cvb-hackaton-web.onrender.com` |
| `cvb-hackaton-api` | Web Service Docker (Spring Boot) | `https://cvb-hackaton-api.onrender.com` |
| `cvb-hackaton-agente` | Web Service Docker (Python) | `https://cvb-hackaton-agente.onrender.com` |
| `cvb-hackaton-db` | Postgres 16 gratis + PostGIS | privada, solo desde Render |

> Si alguno de esos nombres ya está ocupado globalmente, Render avisará: cambia el `name` en `render.yaml` y vuelve a crear el Blueprint.

## Paso a paso en el Dashboard

1. Entrar a **https://dashboard.render.com** e iniciar sesión.
2. Si es la primera vez: **New → GitHub** y autorizar la cuenta que tiene el repo `P1p2gamer26/Microsoft-hackaton` (el repo es público).
3. **New → Blueprint**.
4. Seleccionar el repo `P1p2gamer26/Microsoft-hackaton`.
5. Seleccionar la rama:
   - Usa `main` si ya se fusionó el PR del agente.
   - Si no, usa `feature/agente-local-ollama`.
6. Render detecta automáticamente `render.yaml` en la raíz. Revisar que aparezcan:
   - `cvb-hackaton-db` (Postgres free)
   - `cvb-hackaton-api` (Docker)
   - `cvb-hackaton-agente` (Docker)
   - `cvb-hackaton-web` (Static)
7. Completar los valores que Render pida (por ejemplo `JWT_SECRET`, que ya viene con `generateValue: true`; no hace falta escribirlo).
8. Clic en **Apply** / **Create Blueprint**.
9. Esperar los builds:
   - Frontend: 1–2 min.
   - Agente: 1–2 min.
   - Backend: 5–10 min la primera vez (descarga dependencias Maven).
10. Cuando los 4 recursos estén `Live`, probar las URLs.

## Verificación rápida

```bash
curl https://cvb-hackaton-api.onrender.com/actuator/health
curl https://cvb-hackaton-agente.onrender.com/api/health
curl https://cvb-hackaton-agente.onrender.com/api/sources
curl -X POST https://cvb-hackaton-agente.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Qué problema resuelve Coffee Value Bridge?"}'
curl https://cvb-hackaton-web.onrender.com
```

Respuestas esperadas:

- `/actuator/health` → `{"status":"UP"}`
- `/api/health` → `{"status":"ok", ...}`
- `/api/chat` → JSON con `answer`, `sources`, `mode`. En la nube `mode` será `offline` (contexto con citas) porque Ollama no corre en Render.
- Frontend → la app React con menú Mapa 3D / Campo / Acopio / etc.

Para probar el backend con login:

```bash
curl https://cvb-hackaton-api.onrender.com/api/v1/auth/demo-accounts
curl -X POST https://cvb-hackaton-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"laura@asoexport.com.co","password":"demo123"}'
```

## Base de datos

- Render Postgres **free**, versión 16, con PostGIS.
- Flyway ejecuta `V1__schema_postgis.sql` y `V2__demo_seed_postgis.sql` automáticamente en el primer arranque del backend.
- Render entrega la URL como `postgresql://...`; `backend/docker-entrypoint.sh` la convierte a `jdbc:postgresql://...` antes de arrancar Spring Boot. `SPRING_JPA_HIBERNATE_DDL_AUTO=update` evita fallos de validación de esquema en la demo.
- `ipAllowList: []` = la BD no es accesible desde internet, solo desde los servicios de Render.
- Si quieres conectarte con `psql` desde tu PC, cambia `ipAllowList` para incluir tu IP pública.
- La BD free **expira a los 30 días**: hay que renovarla o subir a un plan pago antes de esa fecha.

## Limitaciones del plan Free

- Los web services se duermen después de 15 min sin tráfico; el primer request tarda ~1 min en despertar.
- 750 horas/mes de instancia gratis para todo el workspace.
- Postgres free: 1 GB y expira en 30 días.
- El filesystem es efímero: no guardes datos importantes en archivos locales del servicio.

## Copiloto IA: local vs nube

- **Local (completo):** instala Ollama, descarga `qwen2.5:3b-instruct` y ejecuta `agent/start.ps1`. Ahí el agente usa tool-calling y cálculos reales.
- **Nube (Render):** el mismo endpoint `/api/chat` responde con fragmentos indexados y citas (`mode: offline`). Es el respaldo para la demo pública sin depender de una GPU.

## Actualizar después

Cada push a la rama conectada dispara un redeploy automático. Para cambiar variables de entorno o el plan, edita el servicio en el Dashboard o `render.yaml` y sincroniza el Blueprint.

## Automatización con API key (opcional)

Si quieres que lo cree desde aquí en vez de hacer clics:

1. En Render: avatar → **Account Settings** → **API Keys** → **Create API Key**.
2. Pega la key aquí o defínela como variable `RENDER_API_KEY`.
3. Con eso se puede validar el Blueprint, crear los servicios y la BD, y verificar los health checks por API.

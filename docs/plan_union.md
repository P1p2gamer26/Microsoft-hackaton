# Plan de unión: un solo producto

Hoy hay dos productos en el repo:

| | CaféTrace (rama `julian/frontend-3d`) | Coffee Value Bridge (`main`, carpeta `coffee-value-bridge - Copy/`) |
|---|---|---|
| Responde | La pregunta oficial: trazabilidad finca → puerto con poca señal (EUDR) | El reto 2 de la diapositiva: vender café tostado |
| Frontend | React + Vite, 9 pantallas por persona, mapa 3D | React + Vite + Tailwind, 14 pantallas, login |
| Backend | No tiene (datos de ejemplo en `frontend/src/datos.ts`) | Spring Boot 3.4 / Java 21, JWT, multiempresa, H2 local o PostgreSQL+PostGIS, ~40 endpoints |
| Python | — | `analytics/` (GIS y Time to Market) |
| Fuerte | Ajuste al caso, demo visual, sin señal, EUDR, EPCIS | Backend real, roles, comparador, compradores, CRM, copiloto regulatorio, reportes |

**Decisión:** un solo producto llamado **CaféTrace**. Nuestro frontend es la cara del producto, el backend de Spring Boot es el motor y `analytics/` se queda como servicio de Python, que también alojará la IA con Ollama.

Así lo contamos: la trazabilidad (Rosa → Hernán → Laura → Anke) abre el mercado europeo, y el módulo comercial de Coffee Value Bridge convierte ese lote trazado en una venta.

## Estructura final del repo
```
/frontend     React (CaféTrace) — único frontend
/backend      Spring Boot (de Coffee Value Bridge) + módulo nuevo de trazabilidad
/analytics    Python FastAPI (GIS, TTM) + endpoints /ia/* con Ollama
/docs         caso, planes, guion del pitch
iniciar-demo.ps1   levanta los tres servicios con un comando
.gitignore    node_modules, target, __pycache__, *.db, .env
```

## Fase 1 · Limpiar el repo
1. Rama `integracion` desde `origin/main`.
2. Sacar del control de versiones lo que no va: `node_modules/` (16.460 archivos), `backend/target/`, `__pycache__/`, `backend/data/*.db`. Añadir `.gitignore`.
3. Renombrar `coffee-value-bridge - Copy/` (tiene espacios) y mover `backend/` y `analytics/` a la raíz. El frontend de Coffee Value Bridge pasa a `legacy/cvb-frontend/` solo como referencia, y se borra cuando todo esté portado.
4. Fusionar `julian/frontend-3d` en `integracion`; `frontend/` queda como el único frontend.
5. **Seguridad:** quitar el `JWT_SECRET` por defecto de `application.yml` en los perfiles que no son `local` y del `.env.example`, que solo debe tener un texto de ejemplo. Revisar que no haya contraseñas reales.

## Fase 2 · Módulo de trazabilidad en Spring Boot
El backend no tiene fincas, polígonos ni eventos del lote. Se agrega un paquete `trazabilidad` que copia el contrato de `frontend/src/datos.ts`:

| Entidad | Campos clave |
|---|---|
| `Finca` | id, nombre, productor, municipio, departamento, hectáreas, altitud, variedad, `poligono` (GeoJSON en texto), estadoEudr, alerta, companyId |
| `LoteTrazable` | id (código), fincaIds, kg, humedad, puntaje, destino, comprador, estadoEudr, companyId |
| `EventoLote` | loteId, etapa, fecha (con zona), lugar, lat, lng, detalle, registradoPor, canal |
| `Consentimiento` | fincaId, destinatarios, aceptado, fecha, retirado |

Endpoints (`/api/v1/trazabilidad`):
- `GET /fincas` · `GET /lotes` · `GET /lotes/{id}` · `POST /lotes` (Acopio)
- `POST /sync`: recibe la cola offline del celular; es idempotente por `registro.id`
- `GET /lotes/{id}/epcis`: EPCIS 2.0, misma lógica que hoy en Cumplimiento
- `GET /resumen-eudr`: los KPIs de Cumplimiento calculados en el servidor
- Semilla demo con las mismas 6 fincas y 3 lotes de `datos.ts`
- Pruebas: el estado del lote hereda el peor estado de sus fincas; el EPCIS lleva `geo:lat,lng`; `sync` no duplica

## Fase 3 · El frontend habla con el backend
1. `frontend/src/api.ts`: cliente con `VITE_API_URL`, token JWT y **respaldo a `datos.ts`** si el backend no responde. La demo nunca se cae.
2. Selector de persona en la barra lateral: Hernán, Laura y Anke inician sesión con usuarios demo del backend (roles de acopio, cumplimiento y comprador). Rosa no inicia sesión porque usa el celular sin señal.
3. Conectar las pantallas: Mapa y Cumplimiento leen `/fincas`, `/lotes` y `/resumen-eudr`; Acopio hace `POST /lotes`; Campo envía su cola a `/sync`; Pasaporte lee `/lotes/{id}`.
4. Traer de Coffee Value Bridge, con el estilo de CaféTrace, solo lo que suma a la historia:
   - **Compradores**: usar `GET /buyers` y el Buyer Match del backend, más el factor EUDR.
   - **Comparador verde vs. tostado**: usar `POST /comparator/simulate`.
   - **Copiloto de exportación**: `POST /copilot/analyze` con fuentes citadas (FDA, EUDR).
   - **Time to Market**: un bloque en Cumplimiento o Compradores.
5. Lo demás de Coffee Value Bridge (CRM, inventario, pedidos, finanzas, reportes, administración) queda en el backend y en Swagger como "Módulo comercial". Va en la hoja de ruta, no en la demo.

## Fase 4 · IA con Ollama (ver `plan_ia_ollama.md`)
Los endpoints `/ia/*` van en `analytics/` (ya es FastAPI). El copiloto del backend usa `LLM_API_URL` apuntando a Ollama, y sin Ollama sigue con su motor de reglas.

## Fase 5 · Arranque y demo
- `iniciar-demo.ps1` sin rutas fijas: busca `java` en el PATH, compila con `mvn -q -DskipTests package` si falta el jar, levanta analytics y frontend y abre el navegador. Comprueba que cada servicio esté vivo (`/api/v1/health`, `/health`).
- Perfil `local` con H2 (sin Docker, porque este PC no lo tiene).
- Video de respaldo de la demo completa.
- Guion de 5 minutos de `plan_mejoras.md`, con un minuto de "módulo comercial" al final.

## Reparto en paralelo
| Tanda | Tarea | Archivos |
|---|---|---|
| 1 (Claude) | Fase 1: limpieza y fusión de ramas | repo |
| 2 (cascadas) | Módulo trazabilidad Spring Boot + pruebas | `backend/.../trazabilidad/**` |
| 2 | `api.ts` con respaldo + selector de persona | `frontend/src/api.ts`, `App.tsx` |
| 2 | `iniciar-demo.ps1` + `.gitignore` + seguridad de configuración | raíz, `application.yml` |
| 3 (cascadas) | Conectar pantallas al backend | `frontend/src/paginas/*` |
| 3 | Compradores, comparador y copiloto contra la API de Coffee Value Bridge | `Compradores.tsx`, `Copiloto.tsx` |
| 3 | `/ia/*` en analytics con Ollama | `analytics/app/ia.py` |

Claude revisa cada entrega, corre `mvn test` y `npm run build`, y prueba la demo en el navegador antes de cada push.

## Decisiones pendientes
1. ¿De acuerdo con que la cara del producto sea CaféTrace y Coffee Value Bridge sea el módulo comercial? Hay que hablarlo con tu compañera.
2. ¿Se hace la limpieza de `main` (sacar `node_modules`, `target` y la base de datos del control de versiones)? Cambia `main`, que es compartido.
3. ¿Con quién se coordina el módulo de trazabilidad en Spring Boot: con tu compañera o lo hace la cascada?

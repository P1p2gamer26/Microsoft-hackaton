# Documentación de API REST — COFFEE VALUE BRIDGE (`/api/v1`)

Swagger interactivo disponible en: `http://localhost:8080/swagger-ui.html`
Esquema OpenAPI JSON: `http://localhost:8080/api/v1/api-docs`

Todas las rutas (salvo `/auth/login`, `/auth/demo-accounts` y `/health`) requieren header:
`Authorization: Bearer <JWT>`

## Endpoints Principales
- **Auth & General:** `POST /auth/login`, `GET /auth/demo-accounts`, `GET /health`, `GET /countries`, `GET /notifications`, `PATCH /notifications/{id}/read`, `GET /search?q=`
- **Dashboard (M1):** `GET /dashboard?countryIso2=&orderStatus=&companyId=`
- **Comparador Verde vs. Tostado (M2):** `POST /comparator/simulate`, `POST /comparator/scenarios`, `GET /comparator/scenarios`
- **Radar de Mercados (M3):** `GET /markets/radar?hsCode=090121&wMarketSize=...`, `POST /markets/countries`, `POST /markets/statistics`, `POST /markets/import-csv`
- **Buscador de Compradores (M4):** `GET /buyers?countryIso2=&city=&buyerType=&privateLabel=&q=`, `POST /buyers`, `POST /buyers/{id}/interactions`
- **CRM Internacional (M5):** `GET /crm/pipeline?staleDaysThreshold=7`, `POST /crm/opportunities`, `PATCH /crm/opportunities/{id}/stage`, `POST /crm/opportunities/{id}/activities`
- **Logística GIS (M6):** `GET /gis/layers?countryIso2=&city=`, `POST /gis/optimize`
- **Export Copilot (M7):** `POST /copilot/analyze`, `GET /copilot/documents`, `POST /copilot/documents/upload` (multipart PDF), `PATCH /copilot/documents/{id}`
- **Productos e Inventarios (M8):** `GET /inventory`, `POST /inventory/products`, `POST /inventory/lots`, `POST /inventory/movements`
- **Pedidos (M9):** `GET /orders`, `POST /orders`, `PATCH /orders/{id}/status`
- **Time to Market (M10):** `GET /ttm`, `POST /ttm/events`
- **Inteligencia Financiera (M11):** `GET /finance`, `POST /finance/exchange-rates`
- **Reportes (M12):** `GET /reports/{reportType}` (14 tipos)
- **Administración (M13):** `GET /admin/overview`, `POST /admin/users`, `POST /admin/companies`

## Microservicio Python Analytics & GIS (`:8001`)
- `GET /health`
- `POST /predict-ttm` (Pandas + Scikit-learn RidgeRegression + Bottleneck)
- `POST /spatial/nearest-buyers` (GeoPandas + Shapely EPSG:4326)
- `POST /spatial/road-estimate` (Haversine + factor vial editable)

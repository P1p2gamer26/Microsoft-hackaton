# Manual de Instalación y Configuración — COFFEE VALUE BRIDGE

## Requisitos
- **Con Docker (Recomendado Producción/Staging):** Docker Desktop / Engine + Docker Compose v2.
- **Desarrollo Local (sin Docker):**
  - Java 21 LTS (Temurin/OpenJDK)
  - Apache Maven 3.9+
  - Node.js 20+ / npm 10+
  - Python 3.12+ (pandas, scikit-learn, geopandas, shapely, flask)

## 1. Despliegue con Docker Compose (PostgreSQL 16 + PostGIS 3.4)
```bash
cp .env.example .env
# Opcional: configure claves en .env (UN_COMTRADE_API_KEY, USITC_API_TOKEN, FDA_API_KEY, OSRM_BASE_URL)
docker compose up --build -d
```
Para incluir **GeoServer** (WMS/WFS sobre las tablas PostGIS):
```bash
docker compose --profile geoserver up --build -d
```
Accesos:
- **Aplicación Web:** `http://localhost:3000`
- **API REST / Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **Microservicio Python GIS/ML:** `http://localhost:8001/health`
- **PostgreSQL + PostGIS:** `localhost:5432` (`coffee_value_bridge`)

## 2. Ejecución Local (Windows PowerShell)
### Backend Spring Boot (perfil `local` con H2 modo PostgreSQL persistente en `./data`)
```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
cd backend
mvn spring-boot:run
```
### Microservicio Python Analytics & GIS
```powershell
cd analytics
python -m app.main
```
### Frontend React + Vite
```powershell
cd frontend
npm install
npm run dev
# Abrir http://localhost:5173
```

## 3. Conexión QGIS a PostGIS
1. Inicie PostgreSQL/PostGIS vía Docker Compose.
2. En QGIS seleccione **Capa → Añadir Capa → Añadir Capas PostGIS** o importe `database/qgis/coffee_value_bridge_layers.qlr`.
3. Todas las capas espaciales utilizan `SRID 4326 (WGS 84)`.

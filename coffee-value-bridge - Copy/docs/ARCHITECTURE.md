# COFFEE VALUE BRIDGE — Arquitectura Técnica

Ver el diagrama de arquitectura, estructura de carpetas, modelo de datos de 40 entidades (PostgreSQL 16 + PostGIS 3.4), matriz de integraciones y dependencias en este documento.

## Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + MapLibre GL JS + Recharts + SheetJS (`xlsx`) + `jsPDF`.
- **Backend:** Java 21 LTS + Spring Boot 3.4 + Spring Security (JWT + RBAC) + Spring Data JPA + Flyway + SpringDoc OpenAPI.
- **Base de Datos:** PostgreSQL 16 + PostGIS 3.4 (`database/postgis/V1__schema_postgis.sql`), con perfil `local` H2 PostgreSQL-mode para ejecución y pruebas locales sin Docker.
- **Inteligencia de Datos y GIS:** Python 3.12 + FastAPI + Pandas + Scikit-learn + Shapely (extensible a GeoPandas y XGBoost).
- **Infraestructura:** Docker, Docker Compose, Nginx, variables de entorno `.env.example`, GeoServer opcional y configuración QGIS (`database/qgis/coffee_value_bridge_layers.qlr`).

## Aislamiento Multi-Empresa (Multi-Tenancy)
- Toda entidad privada (`products`, `coffee_lots`, `inventory_movements`, `sales_opportunities`, `orders`, `export_documents`, `production_costs`, `export_costs`, `time_events`, `notifications`, `audit_logs`) contiene `company_id`.
- El filtro `JwtAuthFilter` establece `TenantContext` a partir del JWT autenticado.
- Solo el rol `GENERAL_ADMIN` puede consultar múltiples empresas o cambiar el filtro de empresa; los usuarios de una empresa exportadora están estrictamente restringidos a su `company_id` en lecturas y escrituras.

## Trazabilidad de Procedencia de Datos (`data_provenance`)
Todos los registros analíticos y de negocio clasifican su procedencia en 4 estados visibles en UI:
- `OFFICIAL`: Fuente oficial verificable (ej. aranceles o guías regulatorias citadas).
- `USER_INPUT`: Datos registrados directamente por el usuario o empresa.
- `ESTIMATED`: Escenarios configurables o estimaciones geodésicas/financieras editables.
- `SIMULATED`: Datos ficticios de demostración para pruebas y presentación a ASOEXPORT.

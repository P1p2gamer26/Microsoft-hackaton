# COFFEE VALUE BRIDGE

**Plataforma integral de inteligencia comercial, geoespacial (GIS) y logística para acelerar la comercialización internacional del café tostado colombiano.**

Orientada inicialmente a **ASOEXPORT** y sus empresas exportadoras asociadas, con arquitectura multi-empresa SaaS B2B.

---

## Módulos Implementados (13/13)
1. **Dashboard Ejecutivo** — KPIs comerciales, logísticos, Time to Market e inventarios con filtros y gráficas interactivas.
2. **Comparador Café Verde vs. Café Tostado** — Fórmulas verificables sin valores fijos ocultos, escenarios guardados y descarga PDF/Excel.
3. **Radar de Mercados Internacionales** — 9 mercados iniciales + alta de nuevos países, HS `090121` / `090122`, Market Opportunity Score ponderable e importación CSV.
4. **Buscador Inteligente de Compradores B2B** — Filtros avanzados, Buyer Match Score, consultas en lenguaje natural y separación explícita de prospectos ficticios DEMO.
5. **CRM Comercial Internacional** — 12 etapas (Kanban, Tabla, Actividades), registro automático de eventos TTM y alertas configurables de inactividad.
6. **Simulador Logístico y Optimizador GIS** — MapLibre GL JS con 12 capas espaciales, comparador de puertos, compradores cercanos a centros de distribución y optimizador 3-objetivo (Menor Costo, Menor Tiempo, Equilibrio).
7. **Export Copilot** — Asistente regulatorio (EE.UU. FDA, Prior Notice, FSVP; UE EUDR/1169; Japón MHLW) con fuentes oficiales citadas, fecha de consulta, biblioteca documental y carga/lectura de PDFs.
8. **Gestión de Productos e Inventarios** — Productos, lotes, movimientos con recálculo automático de saldos, alertas de antigüedad y vida útil validada.
9. **Gestión de Pedidos y Operaciones** — 11 estados operativos, reserva automática de lotes y alertas de retraso.
10. **Time to Market Intelligence** — Desglose de 13 etapas calculado desde `time_events`, detección de cuellos de botella, priorización de compradores, predicción sobre línea base y análisis de ventas perdidas.
11. **Inteligencia Financiera** — Rentabilidad por operación/comprador/mercado/producto, análisis de sensibilidad y conversor multi-divisa con tasas fechadas y con fuente.
12. **Reportes y Analítica** — 14 reportes descargables en Excel (`.xlsx`) y PDF.
13. **Administración y Seguridad** — Autenticación JWT, 6 roles RBAC, aislamiento multi-empresa, panel de conectores externos y bitácora de auditoría.

---

## Credenciales de Demostración (Clave: `Demo2026!`)

| Rol | Correo | Empresa / Alcance |
|---|---|---|
| Administrador General | `admin@cvb-demo.co` | ASOEXPORT Colombia (Multi-empresa) |
| Admin Empresa Exportadora | `exportador@cordillera-demo.co` | Tostadora Cordillera Alta S.A.S. (DEMO) |
| Admin Empresa Aislada | `exportador@sierraverde-demo.co` | Café Origen Sierra Verde Ltda. (DEMO) |
| Analista Comercial | `comercial@cordillera-demo.co` | Tostadora Cordillera Alta S.A.S. (DEMO) |
| Analista Logístico | `logistica@cordillera-demo.co` | Tostadora Cordillera Alta S.A.S. (DEMO) |
| Analista de Cumplimiento | `cumplimiento@cordillera-demo.co` | Tostadora Cordillera Alta S.A.S. (DEMO) |
| Visualizador (Solo lectura) | `visualizador@cordillera-demo.co` | Tostadora Cordillera Alta S.A.S. (DEMO) |

---

## Inicio Rápido

### Opción A: Docker Compose (PostgreSQL 16 + PostGIS 3.4 + Stack Completo)
```bash
cp .env.example .env
docker compose up --build -d
# Frontend: http://localhost:3000
# Backend Swagger OpenAPI: http://localhost:8080/swagger-ui.html
# Analytics Python: http://localhost:8001/health
```

### Opción B: Ejecución Local (sin Docker, usando H2 modo PostgreSQL)
Ver [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Documentación Adicional
- [Arquitectura Técnica](docs/ARCHITECTURE.md)
- [Manual de Instalación y Configuración](docs/INSTALLATION.md)
- [Manual de Usuario](docs/USER_MANUAL.md)
- [Documentación de APIs](docs/API_DOCS.md)
- [Integraciones Externas Pendientes](docs/INTEGRATIONS.md)

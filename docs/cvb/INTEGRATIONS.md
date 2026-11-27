# Integraciones Externas y Lista de Credenciales Pendientes

La plataforma utiliza interfaces desacopladas (`ExternalDataConnector` y `ConnectorRegistry`) que nunca reemplazan silenciosamente datos oficiales por cifras inventadas. Mientras una integración externa no tenga credenciales configuradas, el sistema informa claramente su estado (`DEMO_OR_CSV_FALLBACK`) y habilita carga manual/CSV con trazabilidad de fuente y fecha.

| Servicio | Variables de Entorno | Estado Actual | Acción Requerida para Producción |
|---|---|---|---|
| **UN Comtrade API** | `UN_COMTRADE_API_KEY`, `UN_COMTRADE_BASE_URL` | Conector desacoplado + importación CSV | Solicitar suscripción API en `comtradeapi.un.org` y cargar clave en `.env`. |
| **World Bank WITS** | `WITS_BASE_URL`, `WITS_API_KEY` | Conector preparado + importación CSV | Configurar acceso institucional o carga periódica CSV/Excel. |
| **USITC DataWeb** | `USITC_API_TOKEN` | Conector preparado + modo DEMO | Generar token personal en `dataweb.usitc.gov`. |
| **ITC Trade Map** | Acceso autorizado por cuenta institucional | Requiere licencia/descarga autorizada | Importar archivos autorizados mediante el cargador CSV del Radar de Mercados. |
| **ProColombia / FNC** | `PROCOLOMBIA_FEED_URL`, `FNC_DATA_URL` | Carga estructurada CSV/Excel | Conectar feed institucional cuando ASOEXPORT habilite acceso. |
| **FDA / Requisitos Sanitarios** | `FDA_API_KEY` | Base regulatoria auditable con citas oficiales y fecha | Opcionalmente conectar openFDA API para alertas de retiro/inspección. |
| **Tasas de Cambio (FX)** | `FX_API_URL`, `FX_API_KEY` | Registro manual fechado con fuente | Conectar servicio oficial BanRep / BCE en producción. |
| **OSRM / GraphHopper** | `OSRM_BASE_URL`, `GRAPHHOPPER_API_KEY` | Estimación geodésica editable (`ESTIMATED`) | Desplegar contenedor OSRM con mapa OSM de Colombia o configurar API key GraphHopper. |
| **Cotizaciones Navieras / Operadores** | API privada 3PL / Freightos / Maersk | Escenarios editables marcados `ESTIMATED` | Integrar credenciales B2B de operadores contratados por los asociados. |
| **LLM Export Copilot (Opcional)** | `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL` | Motor determinístico experto + lectura PDFBox | Opcionalmente habilitar proveedor LLM empresarial manteniendo citas y descargos legales. |

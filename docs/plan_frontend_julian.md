# Plan frontend CaféTrace (rama `julian/frontend-3d`)

Pregunta del caso: ¿cómo puede la IA construir trazabilidad desde fincas pequeñas, con poca señal y baja adopción digital?

## Stack
- React 19 + Vite + TypeScript, `react-router-dom`
- MapLibre GL (motor open source de Mapbox) con satélite Esri y terreno 3D AWS Terrarium. Sin token.
- Datos de ejemplo en `frontend/src/datos.ts`: es el contrato que debe servir el backend Spring Boot.

## Pantallas (una por persona del caso)
| Ruta | Persona | Qué muestra |
|------|---------|-------------|
| `/` | Todos | Mapa 3D: montañas reales, polígonos de fincas por estado EUDR, ruta animada finca → acopio → trilla → Buenaventura |
| `/campo` | Rosa (caficultora) | Vista celular offline: caminar el lindero con GPS, registrar entrega por voz, cola sin señal |
| `/acopio` | Hernán (cooperativa) | Registrar lote sin papel, consolidar fincas, código QR del lote |
| `/cumplimiento` | Laura (exportadora) | Panel EUDR: KPIs, lotes, alertas de deforestación, exportar EPCIS |
| `/lote/:id` | Anke (compradora UE) | Pasaporte del lote: línea de tiempo y mini mapa |
| `/ayuda` | Jurado / usuarios | Cómo funciona la solución, IA de Azure en cada paso |

## Reparto
3 tareas en paralelo con la cascada de agentes (`paralelo`):
1. Mapa 3D
2. Campo + Acopio
3. Cumplimiento + Lote + Ayuda

Claude revisa cada worktree, compila, prueba en navegador y fusiona.

## Fuera del MVP
Login, backend real, sincronización real con Cosmos DB, USSD, integración DIAN/VUCE.

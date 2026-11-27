# CaféTrace · Trazabilidad finca → puerto

Hackathon Microsoft · LEAD Aspire Colombia 2026 · caso Asoexport.

**Pregunta del caso:** ¿cómo puede la IA ayudar a construir trazabilidad desde fincas pequeñas, con poca señal y baja adopción digital?

CaféTrace sigue el café desde el polígono de la finca hasta el puerto, para cumplir el reglamento europeo de deforestación (EUDR), y convierte ese lote trazado en una venta.

| Persona | Pantalla | Qué hace |
|---|---|---|
| Rosa, caficultora (Huila) | Campo | Marca su finca con GPS y registra entregas por voz, sin señal |
| Hernán, acopio (Cauca) | Acopio | Arma el lote con QR, sin papel |
| Laura, exportadora | Cumplimiento | Panel EUDR, alertas de deforestación, EPCIS 2.0 y declaración |
| Anke, compradora (Hamburgo) | Pasaporte del lote | Historia verificable del lote |
| Comercial | Compradores | Compatibilidad lote ↔ comprador y comparador verde vs. tostado |

## Estructura
```
frontend/    React + Vite (CaféTrace): la app
backend/     Spring Boot 3.4 / Java 21 (motor de Coffee Value Bridge + trazabilidad)
analytics/   Python (GIS y Time to Market), opcional
docs/        caso oficial, planes y documentación de Coffee Value Bridge (docs/cvb)
legacy/      frontend anterior de Coffee Value Bridge y despliegue con Docker, como referencia
```

## Arrancar la demo (Windows)
Requisitos: Node 20+, Java 21 y Maven en el PATH.
```powershell
.\iniciar-demo.ps1                 # backend + frontend
.\iniciar-demo.ps1 -SoloFrontend   # sin Java: usa los datos de ejemplo
.\iniciar-demo.ps1 -ConAnalytics   # además el servicio Python
.\detener-demo.ps1
```
Si el backend no responde, el frontend sigue funcionando con los datos de ejemplo de `frontend/src/datos.ts`.

## Planes
- `docs/plan_union.md`: cómo se unieron CaféTrace y Coffee Value Bridge
- `docs/plan_mejoras.md`: mejoras y guion del pitch
- `docs/plan_ia_ollama.md`: IA local con Ollama

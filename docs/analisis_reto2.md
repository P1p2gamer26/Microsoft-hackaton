# Análisis Reto 2: Exportación de café tostado en origen

## Resumen
El café colombiano se exporta mayormente verde; tostarlo en origen captura más valor pero enfrenta costos de envío altos, vida útil corta del producto tostado y competencia directa con tostadores estadounidenses que tienen ventaja logística y de marca.

## Pros de elegir este reto

1. **Impacto económico medible** — pasar de exportar grano verde (~$2/lb) a tostado (~$8-15/lb) multiplica el ingreso del productor. Los jueces ven números claros.
2. **Datos disponibles** — precios de flete, aranceles, shelf-life del café tostado, marketplaces (Amazon, Faire) son públicos. No necesitas acceso especial para prototipar.
3. **Azure Maps + AI encajan natural** — optimización de rutas de envío, predicción de demanda, matching productor-comprador son casos de uso directos de Azure.
4. **Tendencia de mercado a favor** — el consumidor estadounidense ya paga premium por "single origin" y "roasted at origin". El timing es bueno.
5. **Diferenciador claro** — pocos equipos en un hackathon atacan supply chain de café. Es nicho y memorable para los jueces.

## Contras de elegir este reto

1. **Complejidad logística real** — envío internacional, regulaciones FDA, certificaciones, cadena de frío. Difícil simplificar sin que se vea superficial.
2. **El problema no es solo tech** — las barreras son regulatorias, arancelarias y de capital. Una app no las resuelve; en el mejor caso las facilita.
3. **Difícil de demostrar en vivo** — no puedes mostrar un contenedor llegando a Miami en el demo. El prototipo queda en dashboards y simulaciones.
4. **Competencia establecida** — plataformas como Algrano, Cropster y Beyco ya conectan productores con compradores. Hay que diferenciarse de lo existente.
5. **Público objetivo lejano** — los exportadores y compradores mayoristas no están en el hackathon. Validar la propuesta de valor es difícil en 1-2 días.

## Qué construir con tecnología Microsoft (1-2 días)

- **Plataforma de matching productor-importador** con Azure AI Search para conectar fincas con compradores por perfil de taza, volumen y precio.
- **Optimizador de envío** con Azure Maps + datos de navieras para calcular la ruta más barata manteniendo freshness (días desde tueste vs. transit time).
- **Dashboard de costos** en Power BI Embedded que compare: exportar verde vs. tostado, por destino, mostrando el margen neto al productor.
- **Copilot de regulaciones** con Azure OpenAI que responda preguntas sobre requisitos FDA, etiquetado, aranceles por estado.

## Veredicto: viabilidad MEDIA

El reto es potente en narrativa e impacto, pero el problema real es más regulatorio/logístico que tecnológico. En un hackathon de 1-2 días el demo queda en simulaciones y dashboards — funcional pero menos wow que algo interactivo con usuarios reales. Elegible si el equipo tiene contexto de comercio exterior; arriesgado si no.

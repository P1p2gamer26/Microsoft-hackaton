"""Herramientas que el modelo puede invocar en el servidor local.

Las definiciones siguen el formato de tool-calling de Ollama /api/chat.
Todas las cifras que se calculan son estimaciones con supuestos explícitos.
"""

from __future__ import annotations

from knowledge import search, sources

MODULES = [
    "Inteligencia de mercados internacionales: analiza países, demanda, precios, competencia y requisitos de entrada.",
    "Buscador inteligente de compradores: identifica importadores, distribuidores y cadenas, clasificándolos por afinidad.",
    "Gestión comercial y seguimiento de oportunidades: CRM de prospectos, contactos, cotizaciones y negociaciones.",
    "Inteligencia logística y financiera: compara transporte, costos, tiempos y rentabilidad; simula verde vs tostado.",
    "Inteligencia de tiempos de comercialización: mide cada etapa desde el producto disponible hasta la entrega.",
]


TOOL_SPECS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Busca en Propuesta.md y en los archivos docs/*.md. Úsalo para preguntas sobre la idea, problemas, módulos, validación o barreras.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Tema o palabras clave a buscar"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_platform_modules",
            "description": "Lista los cinco componentes de la plataforma Coffee Value Bridge según la propuesta.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_export_scenarios",
            "description": "Compara rentabilidad estimada de exportar café verde frente a café tostado. Todos los valores son supuestos que entrega el usuario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "volume_kg": {"type": "number", "description": "Volumen inicial de café verde en kg"},
                    "green_cost_per_kg": {"type": "number", "description": "Costo del café verde por kg"},
                    "roasting_cost_per_kg": {"type": "number", "description": "Costo de tostión y empaque por kg"},
                    "roast_loss_pct": {"type": "number", "description": "Porcentaje de merma en la tostión"},
                    "green_price_per_kg": {"type": "number", "description": "Precio de venta del café verde por kg"},
                    "roasted_price_per_kg": {"type": "number", "description": "Precio de venta del café tostado por kg"},
                    "green_logistics_per_kg": {"type": "number", "description": "Logística estimada por kg para café verde"},
                    "roasted_logistics_per_kg": {"type": "number", "description": "Logística estimada por kg para café tostado"},
                },
                "required": [
                    "volume_kg", "green_cost_per_kg", "roasting_cost_per_kg",
                    "roast_loss_pct", "green_price_per_kg", "roasted_price_per_kg",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_documents",
            "description": "Lista los documentos del repositorio que el agente puede consultar.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def search_documents(query: str = "") -> dict:
    results = [
        {
            "fuente": item["source"],
            "seccion": item["heading"],
            "texto": item["text"],
        }
        for item in search(str(query), 4)
    ]
    return {"resultados": results, "mensaje": "Sin coincidencias" if not results else None}


def list_platform_modules() -> dict:
    return {
        "modulos": MODULES,
        "fuente": "Propuesta.md",
    }


def list_documents() -> dict:
    return {"documentos": sources()}


def compare_export_scenarios(
    volume_kg: float,
    green_cost_per_kg: float,
    roasting_cost_per_kg: float,
    roast_loss_pct: float,
    green_price_per_kg: float,
    roasted_price_per_kg: float,
    green_logistics_per_kg: float = 0,
    roasted_logistics_per_kg: float = 0,
) -> dict:
    volume = float(volume_kg)
    loss = float(roast_loss_pct) / 100.0
    if volume <= 0 or loss < 0 or loss >= 1:
        raise ValueError("Volumen debe ser > 0 y merma entre 0 y 100")

    green_revenue = volume * float(green_price_per_kg)
    green_cost = volume * (float(green_cost_per_kg) + float(green_logistics_per_kg))
    roasted_kg = volume * (1 - loss)
    roasted_revenue = roasted_kg * float(roasted_price_per_kg)
    roasted_cost = volume * (
        float(green_cost_per_kg)
        + float(roasting_cost_per_kg)
        + float(roasted_logistics_per_kg)
    )

    green_margin = green_revenue - green_cost
    roasted_margin = roasted_revenue - roasted_cost
    green_pct = (green_margin / green_revenue * 100) if green_revenue else 0
    roasted_pct = (roasted_margin / roasted_revenue * 100) if roasted_revenue else 0

    if roasted_margin > green_margin:
        recommendation = (
            "Bajo estos supuestos el tostado deja más utilidad absoluta, "
            "pero requiere más capital y asume merma; valida precio y demanda reales."
        )
    elif roasted_margin < green_margin:
        recommendation = (
            "Bajo estos supuestos conviene más exportar verde; "
            "el tostado no compensa su merma y costo de transformación."
        )
    else:
        recommendation = "Bajo estos supuestos ambos escenarios empatan; compara riesgos y capital requerido."

    def money(value: float) -> float:
        return round(value, 2)

    return {
        "verde": {
            "kg_vendidos": money(volume),
            "ingresos": money(green_revenue),
            "costos": money(green_cost),
            "utilidad": money(green_margin),
            "margen_pct": money(green_pct),
        },
        "tostado": {
            "kg_vendidos": money(roasted_kg),
            "ingresos": money(roasted_revenue),
            "costos": money(roasted_cost),
            "utilidad": money(roasted_margin),
            "margen_pct": money(roasted_pct),
            "capital_estimado": money(volume * (float(green_cost_per_kg) + float(roasting_cost_per_kg))),
        },
        "recomendacion": recommendation,
        "supuestos": [
            "Los valores son estimaciones entregadas por el usuario, no datos de mercado.",
            "La logística se cobra sobre los kg iniciales para facilitar la comparación.",
            "No incluye aranceles, seguros, financiación ni impuestos.",
        ],
        "fuente": "Propuesta.md · módulo de inteligencia logística y financiera",
    }


FUNCTIONS = {
    "search_documents": search_documents,
    "list_platform_modules": list_platform_modules,
    "compare_export_scenarios": compare_export_scenarios,
    "list_documents": list_documents,
}


def run_tool(name: str, arguments: dict | None = None) -> dict:
    function = FUNCTIONS.get(name)
    if function is None:
        return {"error": f"Herramienta desconocida: {name}"}
    try:
        return function(**(arguments or {}))
    except TypeError as exc:
        return {"error": f"Argumentos inválidos para {name}: {exc}"}
    except (ValueError, ZeroDivisionError) as exc:
        return {"error": str(exc)}
    except Exception as exc:  # noqa: BLE001 - el servidor debe seguir vivo
        return {"error": f"Error inesperado en {name}: {exc}"}

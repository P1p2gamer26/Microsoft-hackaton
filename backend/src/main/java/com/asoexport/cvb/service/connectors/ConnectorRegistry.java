package com.asoexport.cvb.service.connectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConnectorRegistry {

    private final List<ExternalDataConnector> connectors;

    public ConnectorRegistry(
            @Value("${app.integrations.un-comtrade-api-key:}") String unComtradeKey,
            @Value("${app.integrations.un-comtrade-base-url:https://comtradeapi.un.org/public/v1}") String unComtradeUrl,
            @Value("${app.integrations.wits-base-url:https://wits.worldbank.org/API/V1}") String witsUrl,
            @Value("${app.integrations.usitc-api-token:}") String usitcToken,
            @Value("${app.integrations.fda-api-key:}") String fdaKey,
            @Value("${app.integrations.fx-api-url:}") String fxUrl,
            @Value("${app.integrations.osrm-base-url:}") String osrmUrl,
            @Value("${app.integrations.llm-enabled:false}") boolean llmEnabled,
            @Value("${app.integrations.llm-api-key:}") String llmKey,
            @Value("${app.integrations.llm-api-url:}") String llmUrl
    ) {
        this.connectors = List.of(
                simple("UN_COMTRADE", "UN Comtrade API", "TRADE", !unComtradeKey.isBlank(),
                        "UN_COMTRADE_API_KEY, UN_COMTRADE_BASE_URL", unComtradeUrl),
                simple("WITS", "World Bank WITS", "TRADE", false,
                        "WITS_BASE_URL, WITS_API_KEY", witsUrl),
                simple("USITC", "USITC DataWeb", "TRADE", !usitcToken.isBlank(),
                        "USITC_API_TOKEN", "https://dataweb.usitc.gov"),
                simple("PROCOLOMBIA", "ProColombia Exportaciones (CSV/Feed)", "TRADE", false,
                        "PROCOLOMBIA_FEED_URL (o carga CSV/Excel)", "https://procolombia.co"),
                simple("FNC", "Federación Nacional de Cafeteros (CSV/Feed)", "TRADE", false,
                        "FNC_DATA_URL (o carga CSV/Excel)", "https://federaciondecafeteros.org"),
                simple("FDA", "U.S. FDA Food Facility / Prior Notice / FSVP", "REGULATORY", !fdaKey.isBlank(),
                        "FDA_API_KEY", "https://www.fda.gov/food/importing-food-products-united-states"),
                simple("FX_RATES", "Servicio de Tasas de Cambio (BanRep / ECB)", "FX", !fxUrl.isBlank(),
                        "FX_API_URL, FX_API_KEY", "https://www.banrep.gov.co"),
                simple("OSRM", "OSRM / GraphHopper Ruteo Terrestre", "LOGISTICS", !osrmUrl.isBlank(),
                        "OSRM_BASE_URL o GRAPHHOPPER_API_KEY", "https://project-osrm.org"),
                simple("LLM_COPILOT", "LLM Export Copilot (Opcional)", "AI",
                        llmEnabled && (!llmKey.isBlank() || !llmUrl.isBlank()),
                        "LLM_ENABLED=true, LLM_API_URL, LLM_API_KEY, LLM_MODEL", "https://docs.coffeevaluebridge.local/copilot")
        );
    }

    public List<Map<String, Object>> listStatuses() {
        return connectors.stream().map(ExternalDataConnector::statusSummary).toList();
    }

    private ExternalDataConnector simple(String code, String name, String category, boolean configured,
                                         String envVars, String url) {
        return new ExternalDataConnector() {
            @Override public String code() { return code; }
            @Override public String name() { return name; }
            @Override public String category() { return category; }
            @Override public boolean isConfigured() { return configured; }
            @Override public String requiredEnvVars() { return envVars; }
            @Override public String officialUrl() { return url; }
            @Override public Map<String, Object> statusSummary() {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", code);
                m.put("name", name);
                m.put("category", category);
                m.put("configured", configured);
                m.put("mode", configured ? "CONFIGURED_EXTERNAL" : "DEMO_OR_CSV_FALLBACK");
                m.put("requiredEnvVars", envVars);
                m.put("officialUrl", url);
                m.put("supportsCsvImport", "TRADE".equals(category) || "FX".equals(category));
                return m;
            }
        };
    }
}


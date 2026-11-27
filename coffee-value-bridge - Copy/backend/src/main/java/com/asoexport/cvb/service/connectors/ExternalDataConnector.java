package com.asoexport.cvb.service.connectors;

import java.util.Map;

/**
 * Interfaz desacoplada para conectores de fuentes externas de comercio, regulación,
 * divisas y ruteo GIS (UN Comtrade, WITS, USITC, ProColombia, FNC, FDA, FX, OSRM).
 */
public interface ExternalDataConnector {
    String code();
    String name();
    String category();
    boolean isConfigured();
    String requiredEnvVars();
    String officialUrl();
    Map<String, Object> statusSummary();
}

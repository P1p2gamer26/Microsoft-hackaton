package com.asoexport.cvb.trazabilidad.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SyncRegistroDto(
        String id,
        String tipo,
        String detalle,
        String fecha,
        Map<String, Object> datos
) {
}

package com.asoexport.cvb.trazabilidad.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ObjectEventDto(
        String type,
        String eventTime,
        String eventTimeZoneOffset,
        String action,
        String bizStep,
        ReadPointDto readPoint,
        List<QuantityDto> quantityList,
        @JsonProperty("cafe:etapa") String etapa,
        @JsonProperty("cafe:lugar") String lugar,
        @JsonProperty("cafe:canal") String canal,
        @JsonProperty("cafe:destino") String destino
) {
}

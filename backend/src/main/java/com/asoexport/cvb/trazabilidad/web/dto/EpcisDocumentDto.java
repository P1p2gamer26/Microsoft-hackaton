package com.asoexport.cvb.trazabilidad.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record EpcisDocumentDto(
        @JsonProperty("@context") List<Object> context,
        String type,
        String schemaVersion,
        String creationDate,
        EpcisBodyDto epcisBody
) {
    public static final String CONTEXT_URL = "https://ref.gs1.org/standards/epcis/2.0/epcis-context.jsonld";

    public static EpcisDocumentDto de(List<ObjectEventDto> eventos) {
        return new EpcisDocumentDto(
                List.of(CONTEXT_URL, Map.of("cafe", "https://coffebite.example/epcis/")),
                "EPCISDocument",
                "2.0",
                java.time.Instant.now().toString(),
                new EpcisBodyDto(eventos)
        );
    }
}

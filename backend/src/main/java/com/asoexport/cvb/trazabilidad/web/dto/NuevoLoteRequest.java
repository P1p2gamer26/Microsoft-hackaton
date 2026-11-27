package com.asoexport.cvb.trazabilidad.web.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NuevoLoteRequest(
        @JsonProperty("id") @JsonAlias("codigo") String id,
        @JsonAlias("fincas") List<String> fincaIds,
        Double kg,
        Double humedad,
        Double puntaje,
        String destino,
        String comprador
) {
}

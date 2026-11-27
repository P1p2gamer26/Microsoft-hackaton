package com.asoexport.cvb.trazabilidad.web.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NuevoEventoRequest(
        String etapa,
        String fecha,
        String lugar,
        List<Double> coord,
        @JsonAlias("latitud") Double lat,
        @JsonAlias("longitud") Double lng,
        String detalle,
        String registradoPor,
        String canal
) {
}

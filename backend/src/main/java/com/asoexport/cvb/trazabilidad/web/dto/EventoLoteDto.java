package com.asoexport.cvb.trazabilidad.web.dto;

import java.util.List;

public record EventoLoteDto(
        String etapa,
        String fecha,
        String lugar,
        List<Double> coord,
        String detalle,
        String registradoPor,
        String canal
) {
}

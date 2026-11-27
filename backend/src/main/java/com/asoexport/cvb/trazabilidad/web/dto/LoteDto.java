package com.asoexport.cvb.trazabilidad.web.dto;

import java.util.List;

public record LoteDto(
        String id,
        List<String> fincaIds,
        Double kg,
        Double humedad,
        Double puntaje,
        String destino,
        String comprador,
        String estado,
        List<EventoLoteDto> eventos
) {
}

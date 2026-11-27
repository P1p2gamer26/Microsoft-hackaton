package com.asoexport.cvb.trazabilidad.web.dto;

import java.util.List;

public record FincaDto(
        String id,
        String nombre,
        String productor,
        String municipio,
        String departamento,
        Double hectareas,
        Integer altitud,
        String variedad,
        List<List<Double>> poligono,
        String estado,
        String alerta
) {
}

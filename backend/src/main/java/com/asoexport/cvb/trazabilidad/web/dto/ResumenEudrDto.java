package com.asoexport.cvb.trazabilidad.web.dto;

public record ResumenEudrDto(
        int fincasConPoligono,
        int fincasGeorreferenciadas,
        int totalFincas,
        int fincasCumplen,
        int porcentajeFincasCumplen,
        int totalLotes,
        int lotesCumplen,
        int porcentajeLotesCumplen,
        int alertasActivas,
        double kgListos
) {
}

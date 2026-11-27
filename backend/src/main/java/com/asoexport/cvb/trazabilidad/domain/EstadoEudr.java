package com.asoexport.cvb.trazabilidad.domain;

import java.util.Locale;

public enum EstadoEudr {
    CUMPLE,
    REVISION,
    RIESGO;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static EstadoEudr fromWire(String value) {
        if (value == null || value.isBlank()) return CUMPLE;
        return valueOf(value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_'));
    }

    public static EstadoEudr peor(EstadoEudr a, EstadoEudr b) {
        return rank(a) >= rank(b) ? a : b;
    }

    private static int rank(EstadoEudr estado) {
        return switch (estado) {
            case CUMPLE -> 0;
            case REVISION -> 1;
            case RIESGO -> 2;
        };
    }
}

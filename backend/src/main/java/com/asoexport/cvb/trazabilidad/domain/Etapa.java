package com.asoexport.cvb.trazabilidad.domain;

import java.util.Locale;

public enum Etapa {
    COSECHA,
    BENEFICIO,
    ACOPIO,
    TRILLA,
    TRANSPORTE,
    PUERTO;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Etapa fromWire(String value) {
        if (value == null || value.isBlank()) return ACOPIO;
        return valueOf(value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_'));
    }

    public String bizStep() {
        return switch (this) {
            case COSECHA, BENEFICIO -> "commissioning";
            case ACOPIO -> "receiving";
            case TRILLA -> "transforming";
            case TRANSPORTE -> "shipping";
            case PUERTO -> "departing";
        };
    }
}

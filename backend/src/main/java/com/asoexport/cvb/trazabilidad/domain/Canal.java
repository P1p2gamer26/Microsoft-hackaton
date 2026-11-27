package com.asoexport.cvb.trazabilidad.domain;

import java.util.Locale;

public enum Canal {
    APP_OFFLINE("app-offline"),
    WHATSAPP("whatsapp"),
    VOZ("voz"),
    WEB("web");

    private final String wire;

    Canal(String wire) {
        this.wire = wire;
    }

    public String wire() {
        return wire;
    }

    public static Canal fromWire(String value) {
        if (value == null || value.isBlank()) return WEB;
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        return valueOf(normalized);
    }
}

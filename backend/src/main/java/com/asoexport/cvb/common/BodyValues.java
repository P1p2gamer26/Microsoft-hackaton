package com.asoexport.cvb.common;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

/**
 * Lectura segura de cuerpos JSON. Evita que un campo ausente se convierta en el
 * literal "null" (String.valueOf(null)) y termine en un 500 de base de datos.
 */
public final class BodyValues {

    private BodyValues() {}

    public static String text(Map<String, Object> body, String key, String fallback) {
        Object valor = body == null ? null : body.get(key);
        if (valor == null) return fallback;
        String texto = String.valueOf(valor).trim();
        return texto.isEmpty() ? fallback : texto;
    }

    public static String requiredText(Map<String, Object> body, String key, String etiqueta) {
        String texto = text(body, key, "");
        if (texto.isEmpty()) throw new ApiException(400, "El campo " + etiqueta + " es obligatorio");
        return texto;
    }

    public static BigDecimal decimal(Map<String, Object> body, String key, String etiqueta) {
        String texto = requiredText(body, key, etiqueta);
        try {
            return new BigDecimal(texto);
        } catch (NumberFormatException ex) {
            throw new ApiException(400, "El campo " + etiqueta + " debe ser un número");
        }
    }

    public static Integer integer(Map<String, Object> body, String key, int fallback) {
        String texto = text(body, key, String.valueOf(fallback));
        try {
            return Integer.valueOf(texto);
        } catch (NumberFormatException ex) {
            throw new ApiException(400, "El campo " + key + " debe ser un número entero");
        }
    }

    public static Long id(Map<String, Object> body, String key, String etiqueta) {
        String texto = requiredText(body, key, etiqueta);
        try {
            return Long.valueOf(texto);
        } catch (NumberFormatException ex) {
            throw new ApiException(400, "El campo " + etiqueta + " debe ser un identificador válido");
        }
    }

    public static LocalDate date(Map<String, Object> body, String key, LocalDate fallback) {
        String texto = text(body, key, "");
        if (texto.isEmpty()) return fallback;
        try {
            return LocalDate.parse(texto);
        } catch (Exception ex) {
            throw new ApiException(400, "El campo " + key + " debe tener formato AAAA-MM-DD");
        }
    }

    public static Instant instant(Map<String, Object> body, String key, Instant fallback) {
        String texto = text(body, key, "");
        if (texto.isEmpty()) return fallback;
        try {
            return Instant.parse(texto);
        } catch (Exception ex) {
            throw new ApiException(400, "El campo " + key + " debe ser una fecha ISO con hora");
        }
    }
}

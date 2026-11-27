package com.asoexport.cvb.trazabilidad.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "traza_sync_registro")
public class SyncRegistro {

    @Id
    @Column(name = "registro_id", nullable = false, unique = true, length = 160)
    private String registroId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(length = 160)
    private String dispositivo;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "recibido_en", nullable = false)
    private Instant recibidoEn = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SyncEstado estado;

    public SyncRegistro() {
    }

    public String getRegistroId() {
        return registroId;
    }

    public void setRegistroId(String registroId) {
        this.registroId = registroId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getDispositivo() {
        return dispositivo;
    }

    public void setDispositivo(String dispositivo) {
        this.dispositivo = dispositivo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Instant getRecibidoEn() {
        return recibidoEn;
    }

    public void setRecibidoEn(Instant recibidoEn) {
        this.recibidoEn = recibidoEn;
    }

    public SyncEstado getEstado() {
        return estado;
    }

    public void setEstado(SyncEstado estado) {
        this.estado = estado;
    }
}

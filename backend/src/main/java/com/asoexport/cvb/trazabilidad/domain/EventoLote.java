package com.asoexport.cvb.trazabilidad.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.OffsetDateTime;

@Entity
@Table(name = "traza_evento_lote")
public class EventoLote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lote_id", nullable = false)
    private LoteTrazable lote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Etapa etapa;

    @Column(nullable = false)
    private OffsetDateTime fecha;

    @Column(nullable = false, length = 180)
    private String lugar;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "registrado_por", nullable = false, length = 160)
    private String registradoPor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Canal canal;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance provenance;

    @Column(name = "recibido_en", nullable = false)
    private Instant recibidoEn = Instant.now();

    public EventoLote() {
    }

    public Long getId() {
        return id;
    }

    public LoteTrazable getLote() {
        return lote;
    }

    public void setLote(LoteTrazable lote) {
        this.lote = lote;
    }

    public Etapa getEtapa() {
        return etapa;
    }

    public void setEtapa(Etapa etapa) {
        this.etapa = etapa;
    }

    public OffsetDateTime getFecha() {
        return fecha;
    }

    public void setFecha(OffsetDateTime fecha) {
        this.fecha = fecha;
    }

    public String getLugar() {
        return lugar;
    }

    public void setLugar(String lugar) {
        this.lugar = lugar;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }

    public Canal getCanal() {
        return canal;
    }

    public void setCanal(Canal canal) {
        this.canal = canal;
    }

    public DataProvenance getProvenance() {
        return provenance;
    }

    public void setProvenance(DataProvenance provenance) {
        this.provenance = provenance;
    }

    public Instant getRecibidoEn() {
        return recibidoEn;
    }

    public void setRecibidoEn(Instant recibidoEn) {
        this.recibidoEn = recibidoEn;
    }
}

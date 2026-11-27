package com.asoexport.cvb.trazabilidad.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "traza_lote", uniqueConstraints = @UniqueConstraint(
        name = "uk_traza_lote_company_codigo", columnNames = {"company_id", "codigo"}))
public class LoteTrazable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String codigo;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "traza_lote_finca",
            joinColumns = @JoinColumn(name = "lote_id"),
            inverseJoinColumns = @JoinColumn(name = "finca_id"))
    private Set<Finca> fincas = new LinkedHashSet<>();

    @Column(nullable = false)
    private Double kg;

    @Column(nullable = false)
    private Double humedad;

    @Column(nullable = false)
    private Double puntaje;

    @Column(nullable = false, length = 180)
    private String destino;

    @Column(nullable = false, length = 180)
    private String comprador;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_eudr", nullable = false, length = 16)
    private EstadoEudr estadoEudr;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance provenance;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();

    public LoteTrazable() {
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Set<Finca> getFincas() {
        return fincas;
    }

    public void setFincas(Set<Finca> fincas) {
        this.fincas = fincas;
    }

    public Double getKg() {
        return kg;
    }

    public void setKg(Double kg) {
        this.kg = kg;
    }

    public Double getHumedad() {
        return humedad;
    }

    public void setHumedad(Double humedad) {
        this.humedad = humedad;
    }

    public Double getPuntaje() {
        return puntaje;
    }

    public void setPuntaje(Double puntaje) {
        this.puntaje = puntaje;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public String getComprador() {
        return comprador;
    }

    public void setComprador(String comprador) {
        this.comprador = comprador;
    }

    public EstadoEudr getEstadoEudr() {
        return estadoEudr;
    }

    public void setEstadoEudr(EstadoEudr estadoEudr) {
        this.estadoEudr = estadoEudr;
    }

    public DataProvenance getProvenance() {
        return provenance;
    }

    public void setProvenance(DataProvenance provenance) {
        this.provenance = provenance;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }
}

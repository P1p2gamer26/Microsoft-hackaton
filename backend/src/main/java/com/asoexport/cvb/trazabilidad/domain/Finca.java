package com.asoexport.cvb.trazabilidad.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;

@Entity
@Table(name = "traza_finca", uniqueConstraints = @UniqueConstraint(
        name = "uk_traza_finca_company_codigo", columnNames = {"company_id", "codigo"}))
public class Finca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String codigo;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false, length = 160)
    private String productor;

    @Column(nullable = false, length = 120)
    private String municipio;

    @Column(nullable = false, length = 60)
    private String departamento;

    @Column(nullable = false)
    private Double hectareas;

    @Column(nullable = false)
    private Integer altitud;

    @Column(nullable = false, length = 120)
    private String variedad;

    @Column(name = "poligono_geojson", nullable = false, columnDefinition = "TEXT")
    private String poligonoGeoJson;

    @Column(name = "bbox_min_lat")
    private Double bboxMinLat;

    @Column(name = "bbox_max_lat")
    private Double bboxMaxLat;

    @Column(name = "bbox_min_lng")
    private Double bboxMinLng;

    @Column(name = "bbox_max_lng")
    private Double bboxMaxLng;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_eudr", nullable = false, length = 16)
    private EstadoEudr estadoEudr;

    @Column(columnDefinition = "TEXT")
    private String alerta;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance provenance;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    public Finca() {
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

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getProductor() {
        return productor;
    }

    public void setProductor(String productor) {
        this.productor = productor;
    }

    public String getMunicipio() {
        return municipio;
    }

    public void setMunicipio(String municipio) {
        this.municipio = municipio;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public Double getHectareas() {
        return hectareas;
    }

    public void setHectareas(Double hectareas) {
        this.hectareas = hectareas;
    }

    public Integer getAltitud() {
        return altitud;
    }

    public void setAltitud(Integer altitud) {
        this.altitud = altitud;
    }

    public String getVariedad() {
        return variedad;
    }

    public void setVariedad(String variedad) {
        this.variedad = variedad;
    }

    public String getPoligonoGeoJson() {
        return poligonoGeoJson;
    }

    public void setPoligonoGeoJson(String poligonoGeoJson) {
        this.poligonoGeoJson = poligonoGeoJson;
    }

    public Double getBboxMinLat() {
        return bboxMinLat;
    }

    public void setBboxMinLat(Double bboxMinLat) {
        this.bboxMinLat = bboxMinLat;
    }

    public Double getBboxMaxLat() {
        return bboxMaxLat;
    }

    public void setBboxMaxLat(Double bboxMaxLat) {
        this.bboxMaxLat = bboxMaxLat;
    }

    public Double getBboxMinLng() {
        return bboxMinLng;
    }

    public void setBboxMinLng(Double bboxMinLng) {
        this.bboxMinLng = bboxMinLng;
    }

    public Double getBboxMaxLng() {
        return bboxMaxLng;
    }

    public void setBboxMaxLng(Double bboxMaxLng) {
        this.bboxMaxLng = bboxMaxLng;
    }

    public EstadoEudr getEstadoEudr() {
        return estadoEudr;
    }

    public void setEstadoEudr(EstadoEudr estadoEudr) {
        this.estadoEudr = estadoEudr;
    }

    public String getAlerta() {
        return alerta;
    }

    public void setAlerta(String alerta) {
        this.alerta = alerta;
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
}

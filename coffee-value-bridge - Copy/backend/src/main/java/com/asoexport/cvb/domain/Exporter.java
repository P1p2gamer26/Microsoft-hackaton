package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "exporters")
public class Exporter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false, unique = true)
    private Long companyId;

    private String fncExporterCode;

    @Column(precision = 14, scale = 2)
    private BigDecimal roastingCapacityKgMonth;

    @Column(columnDefinition = "TEXT")
    private String certifications;

    private Long plantCityId;
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getFncExporterCode() { return fncExporterCode; }
    public void setFncExporterCode(String fncExporterCode) { this.fncExporterCode = fncExporterCode; }
    public BigDecimal getRoastingCapacityKgMonth() { return roastingCapacityKgMonth; }
    public void setRoastingCapacityKgMonth(BigDecimal roastingCapacityKgMonth) { this.roastingCapacityKgMonth = roastingCapacityKgMonth; }
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    public Long getPlantCityId() { return plantCityId; }
    public void setPlantCityId(Long plantCityId) { this.plantCityId = plantCityId; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}

package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "coffee_origins")
public class CoffeeOrigin {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 120)
    private String department;

    private String municipality;
    private Integer altitudeMinM;
    private Integer altitudeMaxM;

    @Column(columnDefinition = "TEXT")
    private String cupProfile;

    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.OFFICIAL;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getMunicipality() { return municipality; }
    public void setMunicipality(String municipality) { this.municipality = municipality; }
    public Integer getAltitudeMinM() { return altitudeMinM; }
    public void setAltitudeMinM(Integer altitudeMinM) { this.altitudeMinM = altitudeMinM; }
    public Integer getAltitudeMaxM() { return altitudeMaxM; }
    public void setAltitudeMaxM(Integer altitudeMaxM) { this.altitudeMaxM = altitudeMaxM; }
    public String getCupProfile() { return cupProfile; }
    public void setCupProfile(String cupProfile) { this.cupProfile = cupProfile; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}

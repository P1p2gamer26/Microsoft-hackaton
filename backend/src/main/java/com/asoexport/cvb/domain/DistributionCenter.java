package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "distribution_centers")
public class DistributionCenter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    private String cityName;
    private String operatorName;
    private boolean supportsColdDryCoffee = true;
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public boolean isSupportsColdDryCoffee() { return supportsColdDryCoffee; }
    public void setSupportsColdDryCoffee(boolean supportsColdDryCoffee) { this.supportsColdDryCoffee = supportsColdDryCoffee; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}

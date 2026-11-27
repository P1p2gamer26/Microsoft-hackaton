package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ports")
public class Port {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 140)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    private String cityName;

    @Column(name = "port_type", nullable = false, length = 30)
    private String portType = "SEAPORT";

    @Column(name = "is_origin_colombia", nullable = false)
    private boolean originColombia = false;

    @Column(precision = 5, scale = 2)
    private BigDecimal avgHandlingDays = BigDecimal.valueOf(2.0);

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.OFFICIAL;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public String getPortType() { return portType; }
    public void setPortType(String portType) { this.portType = portType; }
    public boolean isOriginColombia() { return originColombia; }
    public void setOriginColombia(boolean originColombia) { this.originColombia = originColombia; }
    public BigDecimal getAvgHandlingDays() { return avgHandlingDays; }
    public void setAvgHandlingDays(BigDecimal avgHandlingDays) { this.avgHandlingDays = avgHandlingDays; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}

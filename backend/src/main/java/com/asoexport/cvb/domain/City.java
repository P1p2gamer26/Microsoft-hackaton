package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cities")
public class City {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_id", nullable = false)
    private Long countryId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "state_department", length = 120)
    private String stateDepartment;

    private Double latitude;
    private Double longitude;
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCountryId() { return countryId; }
    public void setCountryId(Long countryId) { this.countryId = countryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStateDepartment() { return stateDepartment; }
    public void setStateDepartment(String stateDepartment) { this.stateDepartment = stateDepartment; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}

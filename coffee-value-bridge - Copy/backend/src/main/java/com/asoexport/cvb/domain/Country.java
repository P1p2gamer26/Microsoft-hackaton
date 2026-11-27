package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "countries")
public class Country {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 2)
    private String iso2;

    @Column(nullable = false, unique = true, length = 3)
    private String iso3;

    @Column(name = "name_es", nullable = false, length = 120)
    private String nameEs;

    @Column(name = "name_en", nullable = false, length = 120)
    private String nameEn;

    private String region;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "USD";

    @Column(name = "default_tariff_pct", precision = 6, scale = 2)
    private BigDecimal defaultTariffPct = BigDecimal.ZERO;

    @Column(name = "regulatory_complexity_score", precision = 5, scale = 2)
    private BigDecimal regulatoryComplexityScore = BigDecimal.valueOf(50);

    private Double latitude;
    private Double longitude;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIso2() { return iso2; }
    public void setIso2(String iso2) { this.iso2 = iso2; }
    public String getIso3() { return iso3; }
    public void setIso3(String iso3) { this.iso3 = iso3; }
    public String getNameEs() { return nameEs; }
    public void setNameEs(String nameEs) { this.nameEs = nameEs; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public BigDecimal getDefaultTariffPct() { return defaultTariffPct; }
    public void setDefaultTariffPct(BigDecimal defaultTariffPct) { this.defaultTariffPct = defaultTariffPct; }
    public BigDecimal getRegulatoryComplexityScore() { return regulatoryComplexityScore; }
    public void setRegulatoryComplexityScore(BigDecimal regulatoryComplexityScore) { this.regulatoryComplexityScore = regulatoryComplexityScore; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

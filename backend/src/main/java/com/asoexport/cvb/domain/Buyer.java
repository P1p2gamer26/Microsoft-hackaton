package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "buyers")
public class Buyer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId; // NULL = shared demo/catalog, non-NULL = private tenant buyer

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    private String cityName;
    private String commercialAddress;
    private String website;

    @Column(columnDefinition = "TEXT")
    private String businessActivity;

    @Column(name = "buyer_type", nullable = false, length = 60)
    private String buyerType;

    private String commercialChannel;
    private String preferredCoffeeType;
    private String preferredPresentation;
    private boolean interestedInColombianCoffee = true;
    private boolean supportsPrivateLabel = false;

    @Column(precision = 14, scale = 2)
    private BigDecimal verifiedPurchaseCapacityKgYear;

    private boolean capacityVerified = false;
    private String publicContactInfo;

    @Column(name = "source_name", nullable = false, length = 160)
    private String sourceName;

    private LocalDate verifiedAt;
    private String prospectStatus = "IDENTIFIED";

    @Column(columnDefinition = "TEXT")
    private String commercialNotes;

    private Double latitude;
    private Double longitude;
    private boolean hypothetical = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public String getCommercialAddress() { return commercialAddress; }
    public void setCommercialAddress(String commercialAddress) { this.commercialAddress = commercialAddress; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getBusinessActivity() { return businessActivity; }
    public void setBusinessActivity(String businessActivity) { this.businessActivity = businessActivity; }
    public String getBuyerType() { return buyerType; }
    public void setBuyerType(String buyerType) { this.buyerType = buyerType; }
    public String getCommercialChannel() { return commercialChannel; }
    public void setCommercialChannel(String commercialChannel) { this.commercialChannel = commercialChannel; }
    public String getPreferredCoffeeType() { return preferredCoffeeType; }
    public void setPreferredCoffeeType(String preferredCoffeeType) { this.preferredCoffeeType = preferredCoffeeType; }
    public String getPreferredPresentation() { return preferredPresentation; }
    public void setPreferredPresentation(String preferredPresentation) { this.preferredPresentation = preferredPresentation; }
    public boolean isInterestedInColombianCoffee() { return interestedInColombianCoffee; }
    public void setInterestedInColombianCoffee(boolean interestedInColombianCoffee) { this.interestedInColombianCoffee = interestedInColombianCoffee; }
    public boolean isSupportsPrivateLabel() { return supportsPrivateLabel; }
    public void setSupportsPrivateLabel(boolean supportsPrivateLabel) { this.supportsPrivateLabel = supportsPrivateLabel; }
    public BigDecimal getVerifiedPurchaseCapacityKgYear() { return verifiedPurchaseCapacityKgYear; }
    public void setVerifiedPurchaseCapacityKgYear(BigDecimal verifiedPurchaseCapacityKgYear) { this.verifiedPurchaseCapacityKgYear = verifiedPurchaseCapacityKgYear; }
    public boolean isCapacityVerified() { return capacityVerified; }
    public void setCapacityVerified(boolean capacityVerified) { this.capacityVerified = capacityVerified; }
    public String getPublicContactInfo() { return publicContactInfo; }
    public void setPublicContactInfo(String publicContactInfo) { this.publicContactInfo = publicContactInfo; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public LocalDate getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDate verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getProspectStatus() { return prospectStatus; }
    public void setProspectStatus(String prospectStatus) { this.prospectStatus = prospectStatus; }
    public String getCommercialNotes() { return commercialNotes; }
    public void setCommercialNotes(String commercialNotes) { this.commercialNotes = commercialNotes; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public boolean isHypothetical() { return hypothetical; }
    public void setHypothetical(boolean hypothetical) { this.hypothetical = hypothetical; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

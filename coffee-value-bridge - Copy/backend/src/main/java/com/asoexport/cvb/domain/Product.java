package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 60)
    private String sku;

    @Column(name = "commercial_name", nullable = false, length = 180)
    private String commercialName;

    @Column(name = "coffee_type", nullable = false, length = 60)
    private String coffeeType;

    @Column(name = "hs_code", nullable = false, length = 10)
    private String hsCode = "090121";

    private Long originId;
    private String department;
    private String municipality;
    private String farmOrLotSource;
    private String variety;
    private String roastProfile;

    @Column(name = "grind_type", nullable = false, length = 40)
    private String grindType = "WHOLE_BEAN";

    private String packagingType;
    private String presentation;

    @Column(name = "unit_price_usd_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPriceUsdKg;

    @Column(name = "min_order_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal minOrderKg = BigDecimal.valueOf(100);

    @Column(name = "validated_shelf_life_days", nullable = false)
    private Integer validatedShelfLifeDays = 365;

    private String certifications;

    @Column(name = "availability_status", nullable = false, length = 30)
    private String availabilityStatus = "AVAILABLE";

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.USER_INPUT;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getCommercialName() { return commercialName; }
    public void setCommercialName(String commercialName) { this.commercialName = commercialName; }
    public String getCoffeeType() { return coffeeType; }
    public void setCoffeeType(String coffeeType) { this.coffeeType = coffeeType; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public Long getOriginId() { return originId; }
    public void setOriginId(Long originId) { this.originId = originId; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getMunicipality() { return municipality; }
    public void setMunicipality(String municipality) { this.municipality = municipality; }
    public String getFarmOrLotSource() { return farmOrLotSource; }
    public void setFarmOrLotSource(String farmOrLotSource) { this.farmOrLotSource = farmOrLotSource; }
    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }
    public String getRoastProfile() { return roastProfile; }
    public void setRoastProfile(String roastProfile) { this.roastProfile = roastProfile; }
    public String getGrindType() { return grindType; }
    public void setGrindType(String grindType) { this.grindType = grindType; }
    public String getPackagingType() { return packagingType; }
    public void setPackagingType(String packagingType) { this.packagingType = packagingType; }
    public String getPresentation() { return presentation; }
    public void setPresentation(String presentation) { this.presentation = presentation; }
    public BigDecimal getUnitPriceUsdKg() { return unitPriceUsdKg; }
    public void setUnitPriceUsdKg(BigDecimal unitPriceUsdKg) { this.unitPriceUsdKg = unitPriceUsdKg; }
    public BigDecimal getMinOrderKg() { return minOrderKg; }
    public void setMinOrderKg(BigDecimal minOrderKg) { this.minOrderKg = minOrderKg; }
    public Integer getValidatedShelfLifeDays() { return validatedShelfLifeDays; }
    public void setValidatedShelfLifeDays(Integer validatedShelfLifeDays) { this.validatedShelfLifeDays = validatedShelfLifeDays; }
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

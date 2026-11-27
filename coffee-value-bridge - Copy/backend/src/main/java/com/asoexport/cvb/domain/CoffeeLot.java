package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "coffee_lots")
public class CoffeeLot {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    private Long warehouseId;

    @Column(name = "lot_code", nullable = false, length = 80)
    private String lotCode;

    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @Column(name = "roast_date", nullable = false)
    private LocalDate roastDate;

    @Column(name = "packaging_date", nullable = false)
    private LocalDate packagingDate;

    @Column(name = "recommended_commercial_limit_date", nullable = false)
    private LocalDate recommendedCommercialLimitDate;

    @Column(name = "initial_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal initialKg;

    @Column(name = "available_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal availableKg;

    @Column(name = "committed_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal committedKg = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE";

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.USER_INPUT;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }
    public String getLotCode() { return lotCode; }
    public void setLotCode(String lotCode) { this.lotCode = lotCode; }
    public LocalDate getProductionDate() { return productionDate; }
    public void setProductionDate(LocalDate productionDate) { this.productionDate = productionDate; }
    public LocalDate getRoastDate() { return roastDate; }
    public void setRoastDate(LocalDate roastDate) { this.roastDate = roastDate; }
    public LocalDate getPackagingDate() { return packagingDate; }
    public void setPackagingDate(LocalDate packagingDate) { this.packagingDate = packagingDate; }
    public LocalDate getRecommendedCommercialLimitDate() { return recommendedCommercialLimitDate; }
    public void setRecommendedCommercialLimitDate(LocalDate recommendedCommercialLimitDate) { this.recommendedCommercialLimitDate = recommendedCommercialLimitDate; }
    public BigDecimal getInitialKg() { return initialKg; }
    public void setInitialKg(BigDecimal initialKg) { this.initialKg = initialKg; }
    public BigDecimal getAvailableKg() { return availableKg; }
    public void setAvailableKg(BigDecimal availableKg) { this.availableKg = availableKg; }
    public BigDecimal getCommittedKg() { return committedKg; }
    public void setCommittedKg(BigDecimal committedKg) { this.committedKg = committedKg; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

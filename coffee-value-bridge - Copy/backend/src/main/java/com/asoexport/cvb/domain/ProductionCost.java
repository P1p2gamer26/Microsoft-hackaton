package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "production_costs")
public class ProductionCost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false, length = 160)
    private String scenarioName;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal greenCoffeeKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal greenPurchasePriceUsdKg;

    @Column(precision = 14, scale = 2)
    private BigDecimal processingSelectionCostUsd = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal roastingCostUsdKg = BigDecimal.ZERO;

    @Column(precision = 6, scale = 2)
    private BigDecimal roastingWeightLossPct = BigDecimal.valueOf(18.0);

    @Column(precision = 10, scale = 2)
    private BigDecimal grindingCostUsdKg = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal packagingCostUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal labelingCostUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal storageCostUsd = BigDecimal.ZERO;

    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.ESTIMATED;

    private Instant createdAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getScenarioName() { return scenarioName; }
    public void setScenarioName(String scenarioName) { this.scenarioName = scenarioName; }
    public BigDecimal getGreenCoffeeKg() { return greenCoffeeKg; }
    public void setGreenCoffeeKg(BigDecimal greenCoffeeKg) { this.greenCoffeeKg = greenCoffeeKg; }
    public BigDecimal getGreenPurchasePriceUsdKg() { return greenPurchasePriceUsdKg; }
    public void setGreenPurchasePriceUsdKg(BigDecimal greenPurchasePriceUsdKg) { this.greenPurchasePriceUsdKg = greenPurchasePriceUsdKg; }
    public BigDecimal getProcessingSelectionCostUsd() { return processingSelectionCostUsd; }
    public void setProcessingSelectionCostUsd(BigDecimal processingSelectionCostUsd) { this.processingSelectionCostUsd = processingSelectionCostUsd; }
    public BigDecimal getRoastingCostUsdKg() { return roastingCostUsdKg; }
    public void setRoastingCostUsdKg(BigDecimal roastingCostUsdKg) { this.roastingCostUsdKg = roastingCostUsdKg; }
    public BigDecimal getRoastingWeightLossPct() { return roastingWeightLossPct; }
    public void setRoastingWeightLossPct(BigDecimal roastingWeightLossPct) { this.roastingWeightLossPct = roastingWeightLossPct; }
    public BigDecimal getGrindingCostUsdKg() { return grindingCostUsdKg; }
    public void setGrindingCostUsdKg(BigDecimal grindingCostUsdKg) { this.grindingCostUsdKg = grindingCostUsdKg; }
    public BigDecimal getPackagingCostUsd() { return packagingCostUsd; }
    public void setPackagingCostUsd(BigDecimal packagingCostUsd) { this.packagingCostUsd = packagingCostUsd; }
    public BigDecimal getLabelingCostUsd() { return labelingCostUsd; }
    public void setLabelingCostUsd(BigDecimal labelingCostUsd) { this.labelingCostUsd = labelingCostUsd; }
    public BigDecimal getStorageCostUsd() { return storageCostUsd; }
    public void setStorageCostUsd(BigDecimal storageCostUsd) { this.storageCostUsd = storageCostUsd; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "export_costs")
public class ExportCost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    private Long productionCostId;

    @Column(precision = 14, scale = 2)
    private BigDecimal domesticTransportUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal internationalTransportUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal insuranceUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal customsFeesUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal tariffsUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal destinationDistributionUsd = BigDecimal.ZERO;

    @Column(precision = 14, scale = 2)
    private BigDecimal commercialCommissionUsd = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal greenSalePriceUsdKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal roastedSalePriceUsdKg;

    @Column(precision = 6, scale = 2)
    private BigDecimal expectedMarginPct = BigDecimal.valueOf(20.0);

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.ESTIMATED;

    private Instant createdAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getProductionCostId() { return productionCostId; }
    public void setProductionCostId(Long productionCostId) { this.productionCostId = productionCostId; }
    public BigDecimal getDomesticTransportUsd() { return domesticTransportUsd; }
    public void setDomesticTransportUsd(BigDecimal domesticTransportUsd) { this.domesticTransportUsd = domesticTransportUsd; }
    public BigDecimal getInternationalTransportUsd() { return internationalTransportUsd; }
    public void setInternationalTransportUsd(BigDecimal internationalTransportUsd) { this.internationalTransportUsd = internationalTransportUsd; }
    public BigDecimal getInsuranceUsd() { return insuranceUsd; }
    public void setInsuranceUsd(BigDecimal insuranceUsd) { this.insuranceUsd = insuranceUsd; }
    public BigDecimal getCustomsFeesUsd() { return customsFeesUsd; }
    public void setCustomsFeesUsd(BigDecimal customsFeesUsd) { this.customsFeesUsd = customsFeesUsd; }
    public BigDecimal getTariffsUsd() { return tariffsUsd; }
    public void setTariffsUsd(BigDecimal tariffsUsd) { this.tariffsUsd = tariffsUsd; }
    public BigDecimal getDestinationDistributionUsd() { return destinationDistributionUsd; }
    public void setDestinationDistributionUsd(BigDecimal destinationDistributionUsd) { this.destinationDistributionUsd = destinationDistributionUsd; }
    public BigDecimal getCommercialCommissionUsd() { return commercialCommissionUsd; }
    public void setCommercialCommissionUsd(BigDecimal commercialCommissionUsd) { this.commercialCommissionUsd = commercialCommissionUsd; }
    public BigDecimal getGreenSalePriceUsdKg() { return greenSalePriceUsdKg; }
    public void setGreenSalePriceUsdKg(BigDecimal greenSalePriceUsdKg) { this.greenSalePriceUsdKg = greenSalePriceUsdKg; }
    public BigDecimal getRoastedSalePriceUsdKg() { return roastedSalePriceUsdKg; }
    public void setRoastedSalePriceUsdKg(BigDecimal roastedSalePriceUsdKg) { this.roastedSalePriceUsdKg = roastedSalePriceUsdKg; }
    public BigDecimal getExpectedMarginPct() { return expectedMarginPct; }
    public void setExpectedMarginPct(BigDecimal expectedMarginPct) { this.expectedMarginPct = expectedMarginPct; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

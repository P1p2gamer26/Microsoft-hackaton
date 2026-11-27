package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "logistics_quotes")
public class LogisticsQuote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    private Long routeId;
    private String carrierName;
    private String transportMode;

    @Column(precision = 14, scale = 2)
    private BigDecimal cargoWeightKg;

    @Column(precision = 14, scale = 2)
    private BigDecimal freightCostUsd;

    @Column(precision = 14, scale = 2)
    private BigDecimal insuranceCostUsd;

    @Column(precision = 14, scale = 2)
    private BigDecimal customsCostUsd;

    @Column(precision = 14, scale = 2)
    private BigDecimal totalCostUsd;

    @Column(precision = 6, scale = 2)
    private BigDecimal estimatedDays;

    private LocalDate validUntil;

    @Enumerated(EnumType.STRING)
    private DataProvenance dataProvenance = DataProvenance.ESTIMATED;

    private Instant createdAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }
    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }
    public BigDecimal getCargoWeightKg() { return cargoWeightKg; }
    public void setCargoWeightKg(BigDecimal cargoWeightKg) { this.cargoWeightKg = cargoWeightKg; }
    public BigDecimal getFreightCostUsd() { return freightCostUsd; }
    public void setFreightCostUsd(BigDecimal freightCostUsd) { this.freightCostUsd = freightCostUsd; }
    public BigDecimal getInsuranceCostUsd() { return insuranceCostUsd; }
    public void setInsuranceCostUsd(BigDecimal insuranceCostUsd) { this.insuranceCostUsd = insuranceCostUsd; }
    public BigDecimal getCustomsCostUsd() { return customsCostUsd; }
    public void setCustomsCostUsd(BigDecimal customsCostUsd) { this.customsCostUsd = customsCostUsd; }
    public BigDecimal getTotalCostUsd() { return totalCostUsd; }
    public void setTotalCostUsd(BigDecimal totalCostUsd) { this.totalCostUsd = totalCostUsd; }
    public BigDecimal getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(BigDecimal estimatedDays) { this.estimatedDays = estimatedDays; }
    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "order_number", nullable = false, length = 60)
    private String orderNumber;

    private Long opportunityId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    private Long routeId;

    @Column(nullable = false, length = 40)
    private String status = "RECEIVED";
    // RECEIVED, CONFIRMED, INVENTORY_RESERVED, PREPARATION, PACKAGING, DOCUMENTATION,
    // DISPATCHED, IN_TRANSIT, DESTINATION_CUSTOMS, DELIVERED, CLOSED

    private String incoterm = "CIF";
    private String currency = "USD";

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalKg;

    @Column(nullable = false, precision = 16, scale = 2)
    private BigDecimal totalRevenueUsd;

    @Column(precision = 16, scale = 2)
    private BigDecimal productCostUsd = BigDecimal.ZERO;

    @Column(precision = 16, scale = 2)
    private BigDecimal transformationCostUsd = BigDecimal.ZERO;

    @Column(precision = 16, scale = 2)
    private BigDecimal logisticsCostUsd = BigDecimal.ZERO;

    @Column(precision = 16, scale = 2)
    private BigDecimal exportExpensesUsd = BigDecimal.ZERO;

    @Column(precision = 16, scale = 2)
    private BigDecimal financialCostUsd = BigDecimal.ZERO;

    @Column(precision = 16, scale = 2)
    private BigDecimal commissionCostUsd = BigDecimal.ZERO;

    private String carrierName;
    private Instant confirmedAt;
    private LocalDate plannedDispatchDate;
    private LocalDate actualDispatchDate;
    private LocalDate estimatedDeliveryDate;
    private LocalDate actualDeliveryDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.USER_INPUT;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private String createdBy = "system";

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Long getOpportunityId() { return opportunityId; }
    public void setOpportunityId(Long opportunityId) { this.opportunityId = opportunityId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getIncoterm() { return incoterm; }
    public void setIncoterm(String incoterm) { this.incoterm = incoterm; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getTotalKg() { return totalKg; }
    public void setTotalKg(BigDecimal totalKg) { this.totalKg = totalKg; }
    public BigDecimal getTotalRevenueUsd() { return totalRevenueUsd; }
    public void setTotalRevenueUsd(BigDecimal totalRevenueUsd) { this.totalRevenueUsd = totalRevenueUsd; }
    public BigDecimal getProductCostUsd() { return productCostUsd; }
    public void setProductCostUsd(BigDecimal productCostUsd) { this.productCostUsd = productCostUsd; }
    public BigDecimal getTransformationCostUsd() { return transformationCostUsd; }
    public void setTransformationCostUsd(BigDecimal transformationCostUsd) { this.transformationCostUsd = transformationCostUsd; }
    public BigDecimal getLogisticsCostUsd() { return logisticsCostUsd; }
    public void setLogisticsCostUsd(BigDecimal logisticsCostUsd) { this.logisticsCostUsd = logisticsCostUsd; }
    public BigDecimal getExportExpensesUsd() { return exportExpensesUsd; }
    public void setExportExpensesUsd(BigDecimal exportExpensesUsd) { this.exportExpensesUsd = exportExpensesUsd; }
    public BigDecimal getFinancialCostUsd() { return financialCostUsd; }
    public void setFinancialCostUsd(BigDecimal financialCostUsd) { this.financialCostUsd = financialCostUsd; }
    public BigDecimal getCommissionCostUsd() { return commissionCostUsd; }
    public void setCommissionCostUsd(BigDecimal commissionCostUsd) { this.commissionCostUsd = commissionCostUsd; }
    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    public LocalDate getPlannedDispatchDate() { return plannedDispatchDate; }
    public void setPlannedDispatchDate(LocalDate plannedDispatchDate) { this.plannedDispatchDate = plannedDispatchDate; }
    public LocalDate getActualDispatchDate() { return actualDispatchDate; }
    public void setActualDispatchDate(LocalDate actualDispatchDate) { this.actualDispatchDate = actualDispatchDate; }
    public LocalDate getEstimatedDeliveryDate() { return estimatedDeliveryDate; }
    public void setEstimatedDeliveryDate(LocalDate estimatedDeliveryDate) { this.estimatedDeliveryDate = estimatedDeliveryDate; }
    public LocalDate getActualDeliveryDate() { return actualDeliveryDate; }
    public void setActualDeliveryDate(LocalDate actualDeliveryDate) { this.actualDeliveryDate = actualDeliveryDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}

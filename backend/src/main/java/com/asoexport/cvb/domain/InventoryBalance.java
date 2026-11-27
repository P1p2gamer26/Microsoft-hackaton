package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventory_balances")
public class InventoryBalance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(name = "available_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal availableKg = BigDecimal.ZERO;

    @Column(name = "committed_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal committedKg = BigDecimal.ZERO;

    @Column(name = "pending_sale_kg", nullable = false, precision = 14, scale = 2)
    private BigDecimal pendingSaleKg = BigDecimal.ZERO;

    @Column(name = "oldest_lot_age_days", nullable = false)
    private Integer oldestLotAgeDays = 0;

    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public BigDecimal getAvailableKg() { return availableKg; }
    public void setAvailableKg(BigDecimal availableKg) { this.availableKg = availableKg; }
    public BigDecimal getCommittedKg() { return committedKg; }
    public void setCommittedKg(BigDecimal committedKg) { this.committedKg = committedKg; }
    public BigDecimal getPendingSaleKg() { return pendingSaleKg; }
    public void setPendingSaleKg(BigDecimal pendingSaleKg) { this.pendingSaleKg = pendingSaleKg; }
    public Integer getOldestLotAgeDays() { return oldestLotAgeDays; }
    public void setOldestLotAgeDays(Integer oldestLotAgeDays) { this.oldestLotAgeDays = oldestLotAgeDays; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

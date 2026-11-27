package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    private Long lotId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal quantityKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPriceUsd;

    @Column(nullable = false, precision = 16, scale = 2)
    private BigDecimal lineTotalUsd;

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }
    public BigDecimal getQuantityKg() { return quantityKg; }
    public void setQuantityKg(BigDecimal quantityKg) { this.quantityKg = quantityKg; }
    public BigDecimal getUnitPriceUsd() { return unitPriceUsd; }
    public void setUnitPriceUsd(BigDecimal unitPriceUsd) { this.unitPriceUsd = unitPriceUsd; }
    public BigDecimal getLineTotalUsd() { return lineTotalUsd; }
    public void setLineTotalUsd(BigDecimal lineTotalUsd) { this.lineTotalUsd = lineTotalUsd; }
}

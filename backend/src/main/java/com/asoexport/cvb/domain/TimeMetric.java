package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "time_metrics")
public class TimeMetric {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    private String metricPeriod;

    @Column(precision = 10, scale = 2) private BigDecimal timeToFirstBuyerDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeToFirstContactDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeToQuoteDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeToOrderDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeToDispatchDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeInTransitDays;
    @Column(precision = 10, scale = 2) private BigDecimal timeToDeliveryDays;
    @Column(precision = 10, scale = 2) private BigDecimal totalTimeToMarketDays;

    private String bottleneckStage;
    private Integer sampleSize = 0;
    private Instant computedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getMetricPeriod() { return metricPeriod; }
    public void setMetricPeriod(String metricPeriod) { this.metricPeriod = metricPeriod; }
    public BigDecimal getTimeToFirstBuyerDays() { return timeToFirstBuyerDays; }
    public void setTimeToFirstBuyerDays(BigDecimal timeToFirstBuyerDays) { this.timeToFirstBuyerDays = timeToFirstBuyerDays; }
    public BigDecimal getTimeToFirstContactDays() { return timeToFirstContactDays; }
    public void setTimeToFirstContactDays(BigDecimal timeToFirstContactDays) { this.timeToFirstContactDays = timeToFirstContactDays; }
    public BigDecimal getTimeToQuoteDays() { return timeToQuoteDays; }
    public void setTimeToQuoteDays(BigDecimal timeToQuoteDays) { this.timeToQuoteDays = timeToQuoteDays; }
    public BigDecimal getTimeToOrderDays() { return timeToOrderDays; }
    public void setTimeToOrderDays(BigDecimal timeToOrderDays) { this.timeToOrderDays = timeToOrderDays; }
    public BigDecimal getTimeToDispatchDays() { return timeToDispatchDays; }
    public void setTimeToDispatchDays(BigDecimal timeToDispatchDays) { this.timeToDispatchDays = timeToDispatchDays; }
    public BigDecimal getTimeInTransitDays() { return timeInTransitDays; }
    public void setTimeInTransitDays(BigDecimal timeInTransitDays) { this.timeInTransitDays = timeInTransitDays; }
    public BigDecimal getTimeToDeliveryDays() { return timeToDeliveryDays; }
    public void setTimeToDeliveryDays(BigDecimal timeToDeliveryDays) { this.timeToDeliveryDays = timeToDeliveryDays; }
    public BigDecimal getTotalTimeToMarketDays() { return totalTimeToMarketDays; }
    public void setTotalTimeToMarketDays(BigDecimal totalTimeToMarketDays) { this.totalTimeToMarketDays = totalTimeToMarketDays; }
    public String getBottleneckStage() { return bottleneckStage; }
    public void setBottleneckStage(String bottleneckStage) { this.bottleneckStage = bottleneckStage; }
    public Integer getSampleSize() { return sampleSize; }
    public void setSampleSize(Integer sampleSize) { this.sampleSize = sampleSize; }
    public Instant getComputedAt() { return computedAt; }
}

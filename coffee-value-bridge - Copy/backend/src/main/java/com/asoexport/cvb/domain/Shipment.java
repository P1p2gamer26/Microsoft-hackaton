package com.asoexport.cvb.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "shipments")
public class Shipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    private String trackingNumber;
    private String carrierName;
    private String transportMode;
    private Long originPortId;
    private Long destinationPortId;
    private String currentStatus = "SCHEDULED";
    private Instant departedAt;
    private Instant arrivedCustomsAt;
    private Instant deliveredAt;
    private Integer delayDays = 0;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }
    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }
    public Long getOriginPortId() { return originPortId; }
    public void setOriginPortId(Long originPortId) { this.originPortId = originPortId; }
    public Long getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(Long destinationPortId) { this.destinationPortId = destinationPortId; }
    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }
    public Instant getDepartedAt() { return departedAt; }
    public void setDepartedAt(Instant departedAt) { this.departedAt = departedAt; }
    public Instant getArrivedCustomsAt() { return arrivedCustomsAt; }
    public void setArrivedCustomsAt(Instant arrivedCustomsAt) { this.arrivedCustomsAt = arrivedCustomsAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }
    public Integer getDelayDays() { return delayDays; }
    public void setDelayDays(Integer delayDays) { this.delayDays = delayDays; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

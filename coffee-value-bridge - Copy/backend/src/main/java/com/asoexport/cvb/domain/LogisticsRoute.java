package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "logistics_routes")
public class LogisticsRoute {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "origin_port_id")
    private Port originPort;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_port_id")
    private Port destinationPort;

    @Column(name = "transport_mode", nullable = false, length = 30)
    private String transportMode; // LAND, SEA_LCL, SEA_FCL, AIR

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal distanceKm;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal estimatedTransitDays;

    private Integer transshipments = 0;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedCostUsdKg;

    @Column(precision = 6, scale = 3)
    private BigDecimal insurancePct = BigDecimal.valueOf(0.5);

    @Column(precision = 12, scale = 2)
    private BigDecimal handlingCostUsd = BigDecimal.valueOf(250);

    @Column(precision = 12, scale = 2)
    private BigDecimal storageCostUsd = BigDecimal.valueOf(120);

    private String preservationNotes;

    @Column(columnDefinition = "TEXT")
    private String waypointsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.ESTIMATED;

    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Port getOriginPort() { return originPort; }
    public void setOriginPort(Port originPort) { this.originPort = originPort; }
    public Port getDestinationPort() { return destinationPort; }
    public void setDestinationPort(Port destinationPort) { this.destinationPort = destinationPort; }
    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }
    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }
    public BigDecimal getEstimatedTransitDays() { return estimatedTransitDays; }
    public void setEstimatedTransitDays(BigDecimal estimatedTransitDays) { this.estimatedTransitDays = estimatedTransitDays; }
    public Integer getTransshipments() { return transshipments; }
    public void setTransshipments(Integer transshipments) { this.transshipments = transshipments; }
    public BigDecimal getEstimatedCostUsdKg() { return estimatedCostUsdKg; }
    public void setEstimatedCostUsdKg(BigDecimal estimatedCostUsdKg) { this.estimatedCostUsdKg = estimatedCostUsdKg; }
    public BigDecimal getInsurancePct() { return insurancePct; }
    public void setInsurancePct(BigDecimal insurancePct) { this.insurancePct = insurancePct; }
    public BigDecimal getHandlingCostUsd() { return handlingCostUsd; }
    public void setHandlingCostUsd(BigDecimal handlingCostUsd) { this.handlingCostUsd = handlingCostUsd; }
    public BigDecimal getStorageCostUsd() { return storageCostUsd; }
    public void setStorageCostUsd(BigDecimal storageCostUsd) { this.storageCostUsd = storageCostUsd; }
    public String getPreservationNotes() { return preservationNotes; }
    public void setPreservationNotes(String preservationNotes) { this.preservationNotes = preservationNotes; }
    public String getWaypointsJson() { return waypointsJson; }
    public void setWaypointsJson(String waypointsJson) { this.waypointsJson = waypointsJson; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}

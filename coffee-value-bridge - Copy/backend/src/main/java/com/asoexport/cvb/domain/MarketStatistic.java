package com.asoexport.cvb.domain;

import com.asoexport.cvb.common.DataProvenance;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "market_statistics")
public class MarketStatistic {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    private Long dataSourceId;

    @Column(name = "source_name", nullable = false, length = 140)
    private String sourceName;

    @Column(name = "hs_code", nullable = false, length = 10)
    private String hsCode; // 090121 or 090122

    @Column(name = "statistical_period", nullable = false, length = 20)
    private String statisticalPeriod;

    @Column(name = "consulted_at", nullable = false)
    private LocalDate consultedAt = LocalDate.now();

    @Column(precision = 16, scale = 2)
    private BigDecimal importVolumeTons;

    @Column(precision = 18, scale = 2)
    private BigDecimal importValueUsd;

    @Column(precision = 16, scale = 2)
    private BigDecimal colombiaExportVolumeTons;

    @Column(precision = 18, scale = 2)
    private BigDecimal colombiaExportValueUsd;

    @Column(precision = 12, scale = 2)
    private BigDecimal unitValueUsdKg;

    @Column(precision = 8, scale = 2)
    private BigDecimal yoyGrowthPct;

    @Column(columnDefinition = "TEXT")
    private String topSuppliers;

    @Column(precision = 6, scale = 2)
    private BigDecimal tariffPct;

    @Column(columnDefinition = "TEXT")
    private String regulatorySummary;

    @Column(precision = 10, scale = 2)
    private BigDecimal avgLogisticsCostUsdKg;

    private Integer distanceKm;

    @Column(columnDefinition = "TEXT")
    private String targetSegments;

    private String unitOfMeasure = "TONS / USD";
    private String currency = "USD";
    private String updateStatus = "DEMO_SIMULATED";

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 20)
    private DataProvenance dataProvenance = DataProvenance.SIMULATED;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public Long getDataSourceId() { return dataSourceId; }
    public void setDataSourceId(Long dataSourceId) { this.dataSourceId = dataSourceId; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public String getStatisticalPeriod() { return statisticalPeriod; }
    public void setStatisticalPeriod(String statisticalPeriod) { this.statisticalPeriod = statisticalPeriod; }
    public LocalDate getConsultedAt() { return consultedAt; }
    public void setConsultedAt(LocalDate consultedAt) { this.consultedAt = consultedAt; }
    public BigDecimal getImportVolumeTons() { return importVolumeTons; }
    public void setImportVolumeTons(BigDecimal importVolumeTons) { this.importVolumeTons = importVolumeTons; }
    public BigDecimal getImportValueUsd() { return importValueUsd; }
    public void setImportValueUsd(BigDecimal importValueUsd) { this.importValueUsd = importValueUsd; }
    public BigDecimal getColombiaExportVolumeTons() { return colombiaExportVolumeTons; }
    public void setColombiaExportVolumeTons(BigDecimal colombiaExportVolumeTons) { this.colombiaExportVolumeTons = colombiaExportVolumeTons; }
    public BigDecimal getColombiaExportValueUsd() { return colombiaExportValueUsd; }
    public void setColombiaExportValueUsd(BigDecimal colombiaExportValueUsd) { this.colombiaExportValueUsd = colombiaExportValueUsd; }
    public BigDecimal getUnitValueUsdKg() { return unitValueUsdKg; }
    public void setUnitValueUsdKg(BigDecimal unitValueUsdKg) { this.unitValueUsdKg = unitValueUsdKg; }
    public BigDecimal getYoyGrowthPct() { return yoyGrowthPct; }
    public void setYoyGrowthPct(BigDecimal yoyGrowthPct) { this.yoyGrowthPct = yoyGrowthPct; }
    public String getTopSuppliers() { return topSuppliers; }
    public void setTopSuppliers(String topSuppliers) { this.topSuppliers = topSuppliers; }
    public BigDecimal getTariffPct() { return tariffPct; }
    public void setTariffPct(BigDecimal tariffPct) { this.tariffPct = tariffPct; }
    public String getRegulatorySummary() { return regulatorySummary; }
    public void setRegulatorySummary(String regulatorySummary) { this.regulatorySummary = regulatorySummary; }
    public BigDecimal getAvgLogisticsCostUsdKg() { return avgLogisticsCostUsdKg; }
    public void setAvgLogisticsCostUsdKg(BigDecimal avgLogisticsCostUsdKg) { this.avgLogisticsCostUsdKg = avgLogisticsCostUsdKg; }
    public Integer getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Integer distanceKm) { this.distanceKm = distanceKm; }
    public String getTargetSegments() { return targetSegments; }
    public void setTargetSegments(String targetSegments) { this.targetSegments = targetSegments; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getUpdateStatus() { return updateStatus; }
    public void setUpdateStatus(String updateStatus) { this.updateStatus = updateStatus; }
    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
